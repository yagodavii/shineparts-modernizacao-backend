const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./database/index');
const saraBrain = require('./brain/SaraBrain');
const { authenticateToken, requireRole } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'shineray-secret-key';
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const STAFF_ROLES = ['admin', 'gerente', 'vendedor'];
const MANAGER_ROLES = ['admin', 'gerente'];
const ALLOWED_ORDER_STATUSES = new Set(['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado']);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origem nao permitida pelo CORS'));
    },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${extension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const xmlMimes = ['application/xml', 'text/xml', 'application/octet-stream'];

        if (file.fieldname === 'image') {
            return cb(null, imageMimes.includes(file.mimetype));
        }

        if (file.fieldname === 'xml') {
            return cb(null, xmlMimes.includes(file.mimetype));
        }

        return cb(null, false);
    },
});

const productUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'xml', maxCount: 1 },
]);

app.use('/uploads', express.static(uploadsDir));

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            return resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            return resolve(rows || []);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) return reject(err);
            return resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

function runUpload(middleware, req, res) {
    return new Promise((resolve, reject) => {
        middleware(req, res, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}

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

function getUploadPath(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('/uploads/')) return value;
    return '';
}

function toPublicFileUrl(req, value) {
    if (!value) return value;
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `${req.protocol}://${req.get('host')}${value}`;
}

function parseAuthToken(header) {
    const value = typeof header === 'string' ? header : '';
    const [scheme, token] = value.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
}

function getOptionalUserFromRequest(req) {
    const token = parseAuthToken(req.headers.authorization);
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (_error) {
        return null;
    }
}

io.on('connection', (socket) => {
    console.log('Cliente conectado no Chat:', socket.id);

    socket.on('client_message', (data) => {
        const text = typeof data?.text === 'string' ? data.text.trim() : '';
        if (!text) return;

        io.emit('admin_receive_message', {
            id: socket.id,
            text,
            sender: 'client',
            timestamp: new Date(),
        });
    });

    socket.on('admin_message', (data) => {
        io.emit('client_receive_message', data);
    });
});

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.post('/api/chat', asyncHandler(async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
        return res.status(400).json({ error: 'Mensagem obrigatoria' });
    }
    const currentPath = typeof req.body?.currentPath === 'string' ? req.body.currentPath : null;
    const userContext = req.body?.userContext && typeof req.body.userContext === 'object'
        ? req.body.userContext
        : getOptionalUserFromRequest(req);

    const reply = await saraBrain.process(message, userContext, currentPath);
    return res.json({ reply });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
        return res.status(400).json({ error: 'Username e senha sao obrigatorios' });
    }

    const user = await dbGet('SELECT id, name, username, password, role, active FROM users WHERE username = ?', [username]);
    if (!user || user.active === 0) {
        return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    let isMatch = false;
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
    } else {
        isMatch = password === user.password;
    }

    if (!isMatch) {
        return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    if (typeof user.password === 'string' && !user.password.startsWith('$2')) {
        const newHash = await bcrypt.hash(password, 10);
        await dbRun('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
    }

    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '12h' },
    );

    return res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
        },
    });
}));

app.get('/api/products', asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parsePositiveInt(req.query.limit) || 100, 1), 200);
    const offset = Math.max(parseNonNegativeInt(req.query.offset) || 0, 0);

    const filters = [];
    const params = [];

    if (typeof req.query.category === 'string' && req.query.category.trim()) {
        filters.push('p.category = ?');
        params.push(req.query.category.trim());
    }

    if (typeof req.query.q === 'string' && req.query.q.trim()) {
        filters.push('(p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?)');
        const term = `%${req.query.q.trim()}%`;
        params.push(term, term, term);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `
        SELECT
            p.*,
            (
                SELECT json_group_array(json_object('branch_id', branch_id, 'quantity', quantity))
                FROM product_stock
                WHERE product_id = p.id
            ) AS branch_stock
        FROM products p
        ${whereClause}
        ORDER BY p.id DESC
        LIMIT ?
        OFFSET ?
    `;

    const rows = await dbAll(sql, [...params, limit, offset]);

    const products = rows.map((product) => ({
        ...product,
        branch_stock: parseJsonArray(product.branch_stock),
        image_url: toPublicFileUrl(req, product.image_url),
        xml_file: toPublicFileUrl(req, product.xml_file),
    }));

    res.json(products);
}));

app.get('/api/products/:id', asyncHandler(async (req, res) => {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) return res.status(400).json({ error: 'ID de produto invalido' });

    const row = await dbGet(
        `
        SELECT
            p.*,
            (
                SELECT json_group_array(json_object('branch_id', branch_id, 'quantity', quantity))
                FROM product_stock
                WHERE product_id = p.id
            ) AS branch_stock
        FROM products p
        WHERE p.id = ?
        `,
        [productId],
    );

    if (!row) return res.status(404).json({ error: 'Produto nao encontrado' });

    return res.json({
        ...row,
        branch_stock: parseJsonArray(row.branch_stock),
        image_url: toPublicFileUrl(req, row.image_url),
        xml_file: toPublicFileUrl(req, row.xml_file),
    });
}));

const createProductHandler = asyncHandler(async (req, res) => {
    await runUpload(productUpload, req, res);

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const price = parseNumber(req.body?.price);
    const costPrice = parseNumber(req.body?.cost_price);
    const stockQuantity = parseNonNegativeInt(req.body?.stock_quantity);

    if (!name || !category || price === null || price < 0) {
        return res.status(400).json({ error: 'Dados invalidos. Informe nome, categoria e preco valido.' });
    }

    let imagePath = getUploadPath(req.body?.image_url);
    let xmlPath = getUploadPath(req.body?.xml_file);

    if (req.files?.image?.[0]) imagePath = `/uploads/${req.files.image[0].filename}`;
    if (req.files?.xml?.[0]) xmlPath = `/uploads/${req.files.xml[0].filename}`;

    const result = await dbRun(
        `
        INSERT INTO products
            (name, price, category, image_url, description, cost_price, stock_quantity, xml_file)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            price,
            category,
            imagePath,
            description,
            costPrice ?? 0,
            stockQuantity ?? 0,
            xmlPath,
        ],
    );

    res.status(201).json({
        id: result.lastID,
        name,
        price,
        category,
        image_url: imagePath,
        xml_file: xmlPath,
        description,
        cost_price: costPrice ?? 0,
        stock_quantity: stockQuantity ?? 0,
    });
});

app.post('/api/products', authenticateToken, requireRole(...MANAGER_ROLES), createProductHandler);
app.post('/api/admin/products', authenticateToken, requireRole(...MANAGER_ROLES), createProductHandler);

app.put('/api/products/:id', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    await runUpload(productUpload, req, res);

    const productId = parsePositiveInt(req.params.id);
    if (!productId) return res.status(400).json({ error: 'ID de produto invalido' });

    const existing = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existing) return res.status(404).json({ error: 'Produto nao encontrado' });

    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : existing.name;
    const category = typeof req.body?.category === 'string' && req.body.category.trim() ? req.body.category.trim() : existing.category;
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : (existing.description || '');

    const parsedPrice = parseNumber(req.body?.price);
    const parsedCost = parseNumber(req.body?.cost_price);
    const parsedStock = parseNonNegativeInt(req.body?.stock_quantity);

    const price = parsedPrice === null ? existing.price : parsedPrice;
    const costPrice = parsedCost === null ? existing.cost_price : parsedCost;
    const stockQuantity = parsedStock === null ? existing.stock_quantity : parsedStock;

    if (!name || !category || price === null || price < 0) {
        return res.status(400).json({ error: 'Dados invalidos para atualizacao' });
    }

    let imagePath = req.body?.image_url !== undefined ? getUploadPath(req.body.image_url) : existing.image_url;
    let xmlPath = req.body?.xml_file !== undefined ? getUploadPath(req.body.xml_file) : existing.xml_file;

    if (req.files?.image?.[0]) imagePath = `/uploads/${req.files.image[0].filename}`;
    if (req.files?.xml?.[0]) xmlPath = `/uploads/${req.files.xml[0].filename}`;

    await dbRun(
        `
        UPDATE products
        SET name = ?, price = ?, category = ?, image_url = ?, description = ?, cost_price = ?, stock_quantity = ?, xml_file = ?
        WHERE id = ?
        `,
        [name, price, category, imagePath, description, costPrice, stockQuantity, xmlPath, productId],
    );

    res.json({ message: 'Produto atualizado com sucesso' });
}));

app.delete('/api/products/:id', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const productId = parsePositiveInt(req.params.id);
    if (!productId) return res.status(400).json({ error: 'ID de produto invalido' });

    const result = await dbRun('DELETE FROM products WHERE id = ?', [productId]);
    if (result.changes === 0) return res.status(404).json({ error: 'Produto nao encontrado' });

    return res.status(204).send();
}));

app.post('/api/products/stock', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const productId = parsePositiveInt(req.body?.productId);
    const branchId = parsePositiveInt(req.body?.branchId);
    const quantity = parseNonNegativeInt(req.body?.quantity);

    if (!productId || !branchId || quantity === null) {
        return res.status(400).json({ error: 'Dados de estoque invalidos' });
    }

    await dbRun(
        `
        INSERT INTO product_stock (product_id, branch_id, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT(product_id, branch_id) DO UPDATE SET quantity = excluded.quantity
        `,
        [productId, branchId, quantity],
    );

    return res.json({ message: 'Estoque atualizado' });
}));

app.get('/api/orders', authenticateToken, requireRole(...STAFF_ROLES), asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parsePositiveInt(req.query.limit) || 100, 1), 200);
    const offset = Math.max(parseNonNegativeInt(req.query.offset) || 0, 0);

    const filters = [];
    const params = [];

    if (typeof req.query.status === 'string' && req.query.status.trim()) {
        filters.push('status = ?');
        params.push(req.query.status.trim());
    }

    if (req.query.branch_id !== undefined) {
        const branchId = parsePositiveInt(req.query.branch_id);
        if (!branchId) return res.status(400).json({ error: 'branch_id invalido' });
        filters.push('branch_id = ?');
        params.push(branchId);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const sql = `
        SELECT *
        FROM orders
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
        OFFSET ?
    `;
    const rows = await dbAll(sql, [...params, limit, offset]);

    const orders = rows.map((order) => ({
        ...order,
        items: parseJsonArray(order.items),
        invoice_xml: toPublicFileUrl(req, order.invoice_xml),
    }));

    res.json(orders);
}));

app.get('/api/orders/:id', authenticateToken, requireRole(...STAFF_ROLES), asyncHandler(async (req, res) => {
    const orderId = parsePositiveInt(req.params.id);
    if (!orderId) return res.status(400).json({ error: 'ID de pedido invalido' });

    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Pedido nao encontrado' });

    return res.json({
        ...order,
        items: parseJsonArray(order.items),
        invoice_xml: toPublicFileUrl(req, order.invoice_xml),
    });
}));

const createOrderHandler = asyncHandler(async (req, res) => {
    const total = parseNumber(req.body?.total ?? req.body?.totalAmount);
    const customerNameRaw = req.body?.customer ?? req.body?.customer_name ?? 'Cliente Site';
    const customerName = typeof customerNameRaw === 'string' ? customerNameRaw.trim() : 'Cliente Site';
    const customerEmail = typeof req.body?.customer_email === 'string' ? req.body.customer_email.trim() : null;
    const customerPhone = typeof req.body?.customer_phone === 'string' ? req.body.customer_phone.trim() : null;
    const shippingAddressRaw = req.body?.shipping_address ?? req.body?.customer_address ?? null;
    const shippingAddress = typeof shippingAddressRaw === 'string' ? shippingAddressRaw.trim() : null;
    const paymentMethod = typeof req.body?.payment_method === 'string' ? req.body.payment_method.trim() : null;
    const branchId = req.body?.branch_id ? parsePositiveInt(req.body.branch_id) : null;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (total === null || total <= 0) {
        return res.status(400).json({ error: 'Total obrigatorio e deve ser maior que zero.' });
    }

    if (req.body?.branch_id && !branchId) {
        return res.status(400).json({ error: 'branch_id invalido' });
    }

    const result = await dbRun(
        `
        INSERT INTO orders
            (total_amount, status, customer_name, customer_email, customer_phone, shipping_address, payment_method, items, branch_id)
        VALUES
            (?, 'Pendente', ?, ?, ?, ?, ?, ?, ?)
        `,
        [total, customerName, customerEmail, customerPhone, shippingAddress, paymentMethod, JSON.stringify(items), branchId],
    );

    return res.status(201).json({ message: 'Pedido criado', orderId: result.lastID });
});

app.post('/api/orders', createOrderHandler);
app.post('/api/order', createOrderHandler);

app.put('/api/orders/:id/status', authenticateToken, requireRole(...STAFF_ROLES), asyncHandler(async (req, res) => {
    const orderId = parsePositiveInt(req.params.id);
    if (!orderId) return res.status(400).json({ error: 'ID de pedido invalido' });

    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!ALLOWED_ORDER_STATUSES.has(status)) {
        return res.status(400).json({
            error: `Status invalido. Use: ${Array.from(ALLOWED_ORDER_STATUSES).join(', ')}`,
        });
    }

    const result = await dbRun('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    if (result.changes === 0) return res.status(404).json({ error: 'Pedido nao encontrado' });

    return res.json({ message: 'Status atualizado' });
}));

app.get('/api/branches', authenticateToken, requireRole(...STAFF_ROLES), asyncHandler(async (_req, res) => {
    const branches = await dbAll('SELECT * FROM branches ORDER BY id DESC');
    res.json(branches);
}));

app.post('/api/branches', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const manager = typeof req.body?.manager === 'string' ? req.body.manager.trim() : '';
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const openingHours = typeof req.body?.opening_hours === 'string' ? req.body.opening_hours.trim() : '';
    const status = typeof req.body?.status === 'string' && req.body.status.trim() ? req.body.status.trim() : 'active';

    if (!name) return res.status(400).json({ error: 'Nome da filial e obrigatorio' });

    const result = await dbRun(
        `
        INSERT INTO branches (name, manager, address, phone, email, opening_hours, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [name, manager, address, phone, email, openingHours, status],
    );

    return res.status(201).json({ id: result.lastID });
}));

app.put('/api/branches/:id', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const branchId = parsePositiveInt(req.params.id);
    if (!branchId) return res.status(400).json({ error: 'ID de filial invalido' });

    const existing = await dbGet('SELECT * FROM branches WHERE id = ?', [branchId]);
    if (!existing) return res.status(404).json({ error: 'Filial nao encontrada' });

    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : existing.name;
    const manager = typeof req.body?.manager === 'string' ? req.body.manager.trim() : existing.manager;
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : existing.address;
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : existing.phone;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : existing.email;
    const openingHours = typeof req.body?.opening_hours === 'string' ? req.body.opening_hours.trim() : existing.opening_hours;
    const status = typeof req.body?.status === 'string' && req.body.status.trim() ? req.body.status.trim() : existing.status;

    await dbRun(
        `
        UPDATE branches
        SET name = ?, manager = ?, address = ?, phone = ?, email = ?, opening_hours = ?, status = ?
        WHERE id = ?
        `,
        [name, manager, address, phone, email, openingHours, status, branchId],
    );

    return res.json({ message: 'Filial atualizada' });
}));

app.delete('/api/branches/:id', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const branchId = parsePositiveInt(req.params.id);
    if (!branchId) return res.status(400).json({ error: 'ID de filial invalido' });

    const result = await dbRun('DELETE FROM branches WHERE id = ?', [branchId]);
    if (result.changes === 0) return res.status(404).json({ error: 'Filial nao encontrada' });

    return res.status(204).send();
}));

app.get('/api/branches/:id/stats', authenticateToken, requireRole(...STAFF_ROLES), asyncHandler(async (req, res) => {
    const branchId = parsePositiveInt(req.params.id);
    if (!branchId) return res.status(400).json({ error: 'ID de filial invalido' });

    const [salesRow, pendingRow, stockRow] = await Promise.all([
        dbGet(
            `
            SELECT COALESCE(SUM(total_amount), 0) AS today_sales
            FROM orders
            WHERE branch_id = ? AND date(created_at) = date('now')
            `,
            [branchId],
        ),
        dbGet(
            `
            SELECT COUNT(*) AS pending_orders
            FROM orders
            WHERE branch_id = ? AND status = 'Pendente'
            `,
            [branchId],
        ),
        dbGet(
            `
            SELECT COALESCE(SUM(quantity), 0) AS total_stock
            FROM product_stock
            WHERE branch_id = ?
            `,
            [branchId],
        ),
    ]);

    return res.json({
        today_sales: salesRow?.today_sales || 0,
        pending_orders: pendingRow?.pending_orders || 0,
        total_stock: stockRow?.total_stock || 0,
    });
}));

app.get('/api/admin/stats', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (_req, res) => {
    const [orderStats, productsStats, customersStats] = await Promise.all([
        dbGet('SELECT COALESCE(SUM(total_amount), 0) AS revenue, COUNT(*) AS orders_count FROM orders'),
        dbGet('SELECT COUNT(*) AS products_count FROM products'),
        dbGet('SELECT COUNT(DISTINCT customer_email) AS customers_count FROM orders WHERE customer_email IS NOT NULL'),
    ]);

    res.json({
        revenue: orderStats?.revenue || 0,
        orders_count: orderStats?.orders_count || 0,
        products_count: productsStats?.products_count || 0,
        customers_count: customersStats?.customers_count || 0,
    });
}));

app.get('/api/admin/sales-by-branch', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (_req, res) => {
    const rows = await dbAll(
        `
        SELECT b.name, COALESCE(SUM(o.total_amount), 0) AS value
        FROM branches b
        LEFT JOIN orders o ON o.branch_id = b.id
        GROUP BY b.id
        ORDER BY value DESC
        `,
    );
    res.json(rows);
}));

app.get('/api/admin/top-products', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (_req, res) => {
    const rows = await dbAll(
        `
        SELECT id, name, price, COALESCE(stock_quantity, 0) AS quantity
        FROM products
        ORDER BY quantity DESC, id DESC
        LIMIT 5
        `,
    );

    const data = rows.map((product) => ({
        ...product,
        revenue: Number(product.price || 0) * Number(product.quantity || 0),
    }));

    res.json(data);
}));

app.get('/api/settings', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (_req, res) => {
    const rows = await dbAll('SELECT * FROM settings');
    const settings = {};
    rows.forEach((row) => {
        settings[row.key] = row.value;
    });
    res.json(settings);
}));

app.post('/api/settings', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Payload invalido. Envie um objeto com chave e valor.' });
    }

    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
        if (!key || typeof key !== 'string') continue;
        await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }

    res.json({ message: 'Configuracoes salvas' });
}));

app.get('/api/users', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (_req, res) => {
    const users = await dbAll('SELECT id, name, username, role, last_login, active FROM users ORDER BY id DESC');
    res.json(users);
}));

app.post('/api/users', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = typeof req.body?.role === 'string' ? req.body.role.trim() : 'vendedor';

    if (!name || !username || password.length < 4) {
        return res.status(400).json({ error: 'Dados invalidos. Informe nome, username e senha (minimo 4 caracteres).' });
    }

    if (!STAFF_ROLES.includes(role)) {
        return res.status(400).json({ error: `Role invalida. Use: ${STAFF_ROLES.join(', ')}` });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await dbRun(
        'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
        [name, username, hash, role],
    );

    return res.status(201).json({ id: result.lastID });
}));

app.delete('/api/users/:id', authenticateToken, requireRole(...MANAGER_ROLES), asyncHandler(async (req, res) => {
    const userId = parsePositiveInt(req.params.id);
    if (!userId) return res.status(400).json({ error: 'ID de usuario invalido' });

    if (req.user.id === userId) {
        return res.status(400).json({ error: 'Nao e permitido remover o proprio usuario logado' });
    }

    const result = await dbRun('DELETE FROM users WHERE id = ?', [userId]);
    if (result.changes === 0) return res.status(404).json({ error: 'Usuario nao encontrado' });

    return res.status(204).send();
}));

app.get('/api/payment-methods', asyncHandler(async (_req, res) => {
    const rows = await dbAll('SELECT * FROM payment_methods WHERE active = 1 ORDER BY id DESC');
    res.json(rows);
}));

app.get('/api/shipping-methods', asyncHandler(async (_req, res) => {
    const rows = await dbAll('SELECT * FROM shipping_methods WHERE active = 1 ORDER BY id DESC');
    res.json(rows);
}));

app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada' });
});

app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: `Erro no upload: ${error.message}` });
    }

    if (error && typeof error.message === 'string' && error.message.includes('CORS')) {
        return res.status(403).json({ error: error.message });
    }

    if (error && error.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Violacao de integridade no banco de dados' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
