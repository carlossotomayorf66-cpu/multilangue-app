module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Usuario conectado al socket:', socket.id);

        // Unirse a una sala de clase
        socket.on('join-room', (roomId, userId, userName) => {
            socket.join(roomId);
            socket.to(roomId).emit('user-connected', userId, userName);

            socket.on('disconnect', () => {
                socket.to(roomId).emit('user-disconnected', userId);
            });
        });

        // Señalización WebRTC
        socket.on('offer', (payload) => {
            // payload: { target, caller, sdp }
            io.to(payload.target).emit('offer', payload);
        });

        socket.on('answer', (payload) => {
            io.to(payload.target).emit('answer', payload);
        });

        socket.on('ice-candidate', (incoming) => {
            io.to(incoming.target).emit('ice-candidate', incoming.candidate);
        });

        // Chat
        socket.on('send-chat-message', (roomId, messageData) => {
            // messageData: { sender: 'Juan', text: 'Hola', time: '10:00' }
            socket.to(roomId).emit('chat-message', messageData);
        });

        // Reacciones
        socket.on('send-reaction', (roomId, reaction) => {
            socket.to(roomId).emit('reaction', reaction);
        });

        // Grabación (Solo notifica estado)
        socket.on('recording-started', (roomId) => {
            socket.to(roomId).emit('recording-status', true);
        });

        socket.on('recording-stopped', (roomId) => {
            socket.to(roomId).emit('recording-status', false);
        });
    });
};
