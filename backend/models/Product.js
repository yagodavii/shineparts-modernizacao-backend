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

class Product {
    static async findAll({ q, category, limit = 100, offset = 0 } = {}) {
        const filters = [];
        const params = [];

        if (category) {
            filters.push('p.category = ?');
            params.push(category);
        }

        if (q) {
            filters.push('(p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?)');
            const term = `%${q}%`;
            params.push(term, term, term);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

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

        return dbAll(sql, [...params, limit, offset]);
    }

    static async findById(id) {
        return dbGet(
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
            [id],
        );
    }

    static async create(product) {
        const {
            name,
            price,
            category,
            image_url = '',
            description = '',
            cost_price = 0,
            stock_quantity = 0,
            xml_file = '',
        } = product;

        const result = await dbRun(
            `
            INSERT INTO products
                (name, price, category, image_url, description, cost_price, stock_quantity, xml_file)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [name, price, category, image_url, description, cost_price, stock_quantity, xml_file],
        );

        return { id: result.lastID, ...product };
    }

    static async update(id, product) {
        const {
            name,
            price,
            category,
            image_url = '',
            description = '',
            cost_price = 0,
            stock_quantity = 0,
            xml_file = '',
        } = product;

        return dbRun(
            `
            UPDATE products
            SET name = ?, price = ?, category = ?, image_url = ?, description = ?, cost_price = ?, stock_quantity = ?, xml_file = ?
            WHERE id = ?
            `,
            [name, price, category, image_url, description, cost_price, stock_quantity, xml_file, id],
        );
    }

    static async delete(id) {
        return dbRun('DELETE FROM products WHERE id = ?', [id]);
    }

    static async setBranchStock(productId, branchId, quantity) {
        return dbRun(
            `
            INSERT INTO product_stock (product_id, branch_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(product_id, branch_id) DO UPDATE SET quantity = excluded.quantity
            `,
            [productId, branchId, quantity],
        );
    }
}

module.exports = Product;
