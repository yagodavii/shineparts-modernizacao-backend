const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shineray-secret-key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token de acesso nao fornecido' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        return next();
    } catch (_error) {
        return res.status(401).json({ error: 'Token invalido ou expirado' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario nao autenticado' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Permissao insuficiente' });
        }
        return next();
    };
}

module.exports = {
    authenticateToken,
    requireRole,
};
