const express = require('express');
const Product = require('../models/Product');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const MANAGER_ROLES = ['admin', 'gerente'];

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

router.get('/', async (req, res, next) => {
    try {
        const limit = Math.min(Math.max(parsePositiveInt(req.query.limit) || 100, 1), 200);
        const offset = Math.max(parseNonNegativeInt(req.query.offset) || 0, 0);
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

        const rows = await Product.findAll({
            q: q || undefined,
            category: category || undefined,
            limit,
            offset,
        });

        const products = rows.map((row) => ({
            ...row,
            branch_stock: parseJsonArray(row.branch_stock),
        }));

        return res.json(products);
    } catch (error) {
        return next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de produto invalido' });

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });

        return res.json({
            ...product,
            branch_stock: parseJsonArray(product.branch_stock),
        });
    } catch (error) {
        return next(error);
    }
});

router.post('/', authenticateToken, requireRole(...MANAGER_ROLES), async (req, res, next) => {
    try {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
        const price = parseNumber(req.body?.price);
        const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
        const image_url = typeof req.body?.image_url === 'string' ? req.body.image_url.trim() : '';
        const xml_file = typeof req.body?.xml_file === 'string' ? req.body.xml_file.trim() : '';
        const cost_price = parseNumber(req.body?.cost_price) ?? 0;
        const stock_quantity = parseNonNegativeInt(req.body?.stock_quantity) ?? 0;

        if (!name || !category || price === null || price < 0) {
            return res.status(400).json({ error: 'Dados invalidos. Informe nome, categoria e preco valido.' });
        }

        const product = await Product.create({
            name,
            category,
            price,
            description,
            image_url,
            xml_file,
            cost_price,
            stock_quantity,
        });

        return res.status(201).json(product);
    } catch (error) {
        return next(error);
    }
});

router.put('/:id', authenticateToken, requireRole(...MANAGER_ROLES), async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de produto invalido' });

        const existing = await Product.findById(id);
        if (!existing) return res.status(404).json({ error: 'Produto nao encontrado' });

        const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : existing.name;
        const category = typeof req.body?.category === 'string' && req.body.category.trim() ? req.body.category.trim() : existing.category;
        const parsedPrice = parseNumber(req.body?.price);
        const price = parsedPrice === null ? existing.price : parsedPrice;
        const description = typeof req.body?.description === 'string' ? req.body.description.trim() : (existing.description || '');
        const image_url = typeof req.body?.image_url === 'string' ? req.body.image_url.trim() : (existing.image_url || '');
        const xml_file = typeof req.body?.xml_file === 'string' ? req.body.xml_file.trim() : (existing.xml_file || '');
        const cost_price = parseNumber(req.body?.cost_price);
        const stock_quantity = parseNonNegativeInt(req.body?.stock_quantity);

        if (!name || !category || price === null || price < 0) {
            return res.status(400).json({ error: 'Dados invalidos para atualizacao' });
        }

        await Product.update(id, {
            name,
            category,
            price,
            description,
            image_url,
            xml_file,
            cost_price: cost_price === null ? existing.cost_price : cost_price,
            stock_quantity: stock_quantity === null ? existing.stock_quantity : stock_quantity,
        });

        return res.json({ message: 'Produto atualizado com sucesso' });
    } catch (error) {
        return next(error);
    }
});

router.delete('/:id', authenticateToken, requireRole(...MANAGER_ROLES), async (req, res, next) => {
    try {
        const id = parsePositiveInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID de produto invalido' });

        const result = await Product.delete(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Produto nao encontrado' });

        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
});

router.post('/stock/update', authenticateToken, requireRole(...MANAGER_ROLES), async (req, res, next) => {
    try {
        const productId = parsePositiveInt(req.body?.productId);
        const branchId = parsePositiveInt(req.body?.branchId);
        const quantity = parseNonNegativeInt(req.body?.quantity);

        if (!productId || !branchId || quantity === null) {
            return res.status(400).json({ error: 'Dados de estoque invalidos' });
        }

        await Product.setBranchStock(productId, branchId, quantity);
        return res.json({ message: 'Estoque atualizado' });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
