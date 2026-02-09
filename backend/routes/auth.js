const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shineray-secret-key';

router.post('/login', async (req, res, next) => {
    try {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e senha sao obrigatorios' });
        }

        const user = await User.findByUsername(username);
        if (!user || user.active === 0) {
            return res.status(401).json({ error: 'Credenciais invalidas' });
        }

        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais invalidas' });
        }

        if (typeof user.password === 'string' && !user.password.startsWith('$2')) {
            const hash = await bcrypt.hash(password, 10);
            await User.touchLastLogin(user.id);
            await User.updatePassword(user.id, hash);
        } else {
            await User.touchLastLogin(user.id);
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, name: user.name, role: user.role },
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
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
