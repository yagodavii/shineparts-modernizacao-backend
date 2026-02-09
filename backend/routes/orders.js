const express = require('express');
const Order = require('../models/Order');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const STAFF_ROLES = ['admin', 'gerente', 'vendedor'];
const ALLOWED_STATUSES = new Set(['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado']);

function parsePositiveInt(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    return parsed;
}

function parseNonNegativeInt(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) return null;
    return parsed;
}

function parseNumber(value) {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
    return parsed;
}

function parseJsonArray(value) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
}

router.get('/', authenticateToken, requireRole(...STAFF_ROLES), async (req, res, next) => {
    try {
        const limit = Math.min(Math.max(parsePositiveInt(req.query.limit) || 100, 1), 200);
        const offset = Math.max(parseNonNegativeInt(req.query.offset) || 0, 0);
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const branchId = req.query.branch_id ? parsePositiveInt(req.query.branch_id) : null;

        if (req.query.branch_id && !branchId) {
            return res.status(400).json({ error: 'branch_id invalido' });
        }

        const rows = await Order.findAll({
            status: status || undefined,
            branch_id: branchId || undefined,
            limit,
            offset,
        });

        const orders = rows.map((row) => ({
            ...row,
            items: parseJsonArray(row.items),
        }));

        return res.json(orders);
    } catch (error) {
        return next(error);
    }
});

router.get('/stats', authenticateToken, requireRole(...STAFF_ROLES), async (_req, res, next) => {
    try {
        const stats = await Order.getStats();
        return res.json({
            revenue: stats?.revenue || 0,
            orders_count: stats?.orders_count || 0,
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/:id', authenticateToken, requireRole(...STAFF_ROLES), async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de pedido invalido' });

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Pedido nao encontrado' });

        return res.json({
            ...order,
            items: parseJsonArray(order.items),
        });
    } catch (error) {
        return next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const total = parseNumber(req.body?.total_amount ?? req.body?.total ?? req.body?.totalAmount);
        const customer_name = typeof req.body?.customer_name === 'string'
            ? req.body.customer_name.trim()
            : (typeof req.body?.customer === 'string' ? req.body.customer.trim() : 'Cliente Site');
        const customer_email = typeof req.body?.customer_email === 'string' ? req.body.customer_email.trim() : null;
        const customer_phone = typeof req.body?.customer_phone === 'string' ? req.body.customer_phone.trim() : null;
        const shipping_address = typeof req.body?.shipping_address === 'string'
            ? req.body.shipping_address.trim()
            : (typeof req.body?.customer_address === 'string' ? req.body.customer_address.trim() : null);
        const payment_method = typeof req.body?.payment_method === 'string' ? req.body.payment_method.trim() : null;
        const branch_id = req.body?.branch_id ? parsePositiveInt(req.body.branch_id) : null;
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        if (total === null || total <= 0) {
            return res.status(400).json({ error: 'Total obrigatorio e deve ser maior que zero.' });
        }

        if (req.body?.branch_id && !branch_id) {
            return res.status(400).json({ error: 'branch_id invalido' });
        }

        const order = await Order.create({
            total_amount: total,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            payment_method,
            branch_id,
            items,
        });

        return res.status(201).json({ message: 'Pedido criado', orderId: order.id });
    } catch (error) {
        return next(error);
    }
});

router.put('/:id/status', authenticateToken, requireRole(...STAFF_ROLES), async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de pedido invalido' });

        const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
        if (!ALLOWED_STATUSES.has(status)) {
            return res.status(400).json({
                error: `Status invalido. Use: ${Array.from(ALLOWED_STATUSES).join(', ')}`,
            });
        }

        const result = await Order.updateStatus(id, status);
        if (result.changes === 0) return res.status(404).json({ error: 'Pedido nao encontrado' });

        return res.json({ message: 'Status do pedido atualizado' });
    } catch (error) {
        return next(error);
    }
});

router.delete('/:id', authenticateToken, requireRole(...STAFF_ROLES), async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de pedido invalido' });

        const result = await Order.delete(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Pedido nao encontrado' });

        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
