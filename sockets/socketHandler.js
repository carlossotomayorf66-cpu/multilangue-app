module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Usuario conectado al socket:', socket.id);

        // Unirse a una sala de clase
        socket.on('join-room', (roomId, userId, userName) => {
            socket.join(roomId);
            socket.join(String(userId)); // Allow private messaging
            socket.to(roomId).emit('user-connected', userId, userName);

            socket.on('disconnect', () => {
                socket.to(roomId).emit('user-disconnected', userId);
            });
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


    });
};
