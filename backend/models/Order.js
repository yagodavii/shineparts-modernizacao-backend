const db = require('../database/database');

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

class Order {
    static async findAll({ status, branch_id, limit = 100, offset = 0 } = {}) {
        const filters = [];
        const params = [];

        if (status) {
            filters.push('status = ?');
            params.push(status);
        }

        if (branch_id) {
            filters.push('branch_id = ?');
            params.push(branch_id);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const sql = `
            SELECT *
            FROM orders
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ?
            OFFSET ?
        `;
        return dbAll(sql, [...params, limit, offset]);
    }

    static async findById(id) {
        return dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    }

    static async create(order) {
        const {
            customer_name = 'Cliente Site',
            customer_email = null,
            customer_phone = null,
            shipping_address = null,
            total_amount,
            payment_method = null,
            branch_id = null,
            items = [],
        } = order;

        const result = await dbRun(
            `
            INSERT INTO orders
                (total_amount, status, customer_name, customer_email, customer_phone, shipping_address, payment_method, items, branch_id)
            VALUES
                (?, 'Pendente', ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                total_amount,
                customer_name,
                customer_email,
                customer_phone,
                shipping_address,
                payment_method,
                JSON.stringify(items),
                branch_id,
            ],
        );

        return { id: result.lastID, ...order };
    }

    static async updateStatus(id, status) {
        return dbRun('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }

    static async delete(id) {
        return dbRun('DELETE FROM orders WHERE id = ?', [id]);
    }

    static async getStats() {
        return dbGet(
            'SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as orders_count FROM orders',
        );
    }
}

module.exports = Order;
