const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '90d'
    });
};

exports.register = async (req, res) => {
    try {
        const { full_name, email, password, dni, age, phone } = req.body;
        // Force role ESTUDIANTE and status PENDING for public registration
        const role = 'ESTUDIANTE';
        const status = 'PENDING';

        // Verificar si el usuario ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado.'
            });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        await User.create({
            full_name,
            email,
            password: hashedPassword,
            role,
            status, // PENDING
            dni,
            age,
            phone
        });

        // No token returned. User must wait.
        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.'
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno: ' + error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1) Verificar si email y password existen
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Por favor provee correo y contraseña.'
            });
        }

        // 2) Verificar si el usuario existe y la contraseña es correcta
        const user = await User.findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos.'
            });
        }

        // 3) CHECK STATUS
        if (user.status === 'PENDING') {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta está pendiente de aprobación por el administrador.'
            });
        }

        // 3) Enviar token al cliente
        const token = signToken(user.id, user.role);

        // Ocultar password en la respuesta
        user.password = undefined;

        res.status(200).json({
            success: true,
            token,
            data: user,
            mustChangePassword: !!user.must_change_password // Explicit boolean
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user.id; // From middleware

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updatePassword(userId, hashedPassword);

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMe = async (req, res) => {
    // req.user ya está disponible gracias al middleware protect
    res.status(200).json({
        success: true,
        data: req.user
    });
};
