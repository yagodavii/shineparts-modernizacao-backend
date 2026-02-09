const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'shineray.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
        return;
    }
    console.log('Banco de dados conectado.');
    initDb();
});

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) return reject(err);
            return resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            return resolve(row);
        });
    });
}

async function ensureDefaultAdmin() {
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const fallbackPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';

    const currentAdmin = await get(
        'SELECT id, password FROM users WHERE username = ?',
        [defaultUsername],
    );

    if (!currentAdmin) {
        const hash = await bcrypt.hash(fallbackPassword, 10);
        await run(
            'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
            ['Administrador', defaultUsername, hash, 'admin'],
        );
        console.log('Usuario admin padrao criado.');
        return;
    }

    if (typeof currentAdmin.password === 'string' && !currentAdmin.password.startsWith('$2')) {
        const hash = await bcrypt.hash(currentAdmin.password || fallbackPassword, 10);
        await run('UPDATE users SET password = ? WHERE id = ?', [hash, currentAdmin.id]);
        console.log('Senha de admin migrada para hash bcrypt.');
    }
}

async function initDb() {
    try {
        await run('PRAGMA foreign_keys = ON');
        await run('PRAGMA journal_mode = WAL');

        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'vendedor',
                last_login DATETIME,
                active INTEGER DEFAULT 1
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS branches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                manager TEXT,
                address TEXT,
                phone TEXT,
                email TEXT,
                opening_hours TEXT,
                status TEXT DEFAULT 'active'
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                sku TEXT,
                price REAL,
                cost_price REAL,
                stock_quantity INTEGER DEFAULT 0,
                category TEXT,
                image_url TEXT,
                xml_file TEXT,
                description TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS product_stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                branch_id INTEGER,
                quantity INTEGER DEFAULT 0,
                FOREIGN KEY(product_id) REFERENCES products(id),
                FOREIGN KEY(branch_id) REFERENCES branches(id)
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT,
                customer_email TEXT,
                customer_phone TEXT,
                shipping_address TEXT,
                total_amount REAL,
                status TEXT DEFAULT 'Pendente',
                branch_id INTEGER,
                payment_method TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                invoice_xml TEXT,
                items TEXT
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                fee REAL,
                active INTEGER DEFAULT 1
            )
        `);

        await run(`
            CREATE TABLE IF NOT EXISTS shipping_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                delivery_time TEXT,
                price REAL,
                active INTEGER DEFAULT 1
            )
        `);

        await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_product_stock_unique ON product_stock(product_id, branch_id)');
        await run('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
        await run('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
        await run('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');

        await ensureDefaultAdmin();
        console.log('Banco inicializado com sucesso.');
    } catch (error) {
        console.error('Erro ao inicializar banco:', error.message);
    }
}

module.exports = db;
