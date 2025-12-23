const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// WebSocket Server එක setup කිරීම
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Frontend එක දුවන තැන
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User කෙනෙක් සම්බන්ධ වුණා:', socket.id);

    // යම් User කෙනෙක් අඳින කොට ඒ data අනිත් අයට යැවීම
    socket.on('draw', (data) => {
        // අඳින user හැර අනිත් හැමෝටම data යවනවා (Broadcast)
        socket.broadcast.emit('draw-on-whiteboard', data);
    });

    socket.on('disconnect', () => {
        console.log('User ඉවත් වුණා');
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server එක port ${PORT} එකේ වැඩ...`);
});