const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const { testConnection } = require('./config/db');

const http = require('http');
const socketIo = require('socket.io');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Inicializar Sockets
socketHandler(io);

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/apiRoutes'));
app.use('/api/v1/placement', require('./routes/placementRoutes'));

// Inicializar Servidor y DB
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
    console.log(`\n🚀 Servidor escuchando en http://localhost:${PORT}`);
    await testConnection();
});
