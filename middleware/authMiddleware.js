const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.protect = async (req, res, next) => {
    try {
        let token;

        // 1) Verificar si el token existe en los headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No has iniciado sesión. Por favor ingresa para acceder.'
            });
        }

        // 2) Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Comprobar si el usuario aún existe
        const User = require('../models/User'); // Lazy load to avoid circular deps if any
        const currentUser = await User.findById(decoded.id);

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'El usuario perteneciente a este token ya no existe.'
            });
        }

        // 4) GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles = ['ADMIN', 'PROFESOR']. role = 'ESTUDIANTE'
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción.'
            });
        }
        next();
    };
};
