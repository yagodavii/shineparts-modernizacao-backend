const bcrypt = require('bcryptjs');
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

class User {
    static async findByUsername(username) {
        return dbGet(
            'SELECT id, name, username, password, role, active, last_login FROM users WHERE username = ?',
            [username],
        );
    }

    static async list() {
        return dbAll('SELECT id, name, username, role, active, last_login FROM users ORDER BY id DESC');
    }

    static async create({ name, username, password, role = 'vendedor' }) {
        const hash = await bcrypt.hash(password, 10);
        const result = await dbRun(
            'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
            [name, username, hash, role],
        );
        return { id: result.lastID, name, username, role };
    }

    static async deleteById(id) {
        return dbRun('DELETE FROM users WHERE id = ?', [id]);
    }

    static async touchLastLogin(id) {
        return dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    }

    static async updatePassword(id, passwordHash) {
        return dbRun('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
    }

    static async comparePassword(candidatePassword, storedPassword) {
        if (typeof storedPassword !== 'string') return false;
        if (storedPassword.startsWith('$2')) {
            return bcrypt.compare(candidatePassword, storedPassword);
        }
        return candidatePassword === storedPassword;
    }
}

module.exports = User;
