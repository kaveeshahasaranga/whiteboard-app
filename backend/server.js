const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

const server = http.createServer(app);

// 1. MongoDB Atlas සම්බන්ධතාවය 🛠️
// <password> වෙනුවට ඔයාගේ white123 password එක ඇතුළත් කර ඇත.
const mongoURI = "mongodb+srv://whiteboard_user:white123@cluster0.d8h1vhe.mongodb.net/WhiteboardDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Atlas සමඟ සාර්ථකව සම්බන්ධ වුණා! ✅"))
    .catch(err => console.error("Database Error: ", err));

// 2. Data Schema එක නිර්මාණය (අඳින දත්ත වල අච්චුව)
const StrokeSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    color: String,
    isNewStroke: Boolean,
    timestamp: { type: Date, default: Date.now }
});

const Stroke = mongoose.model('Stroke', StrokeSchema);

// 3. WebSocket Server එක setup කිරීම
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', async (socket) => {
    console.log('User කෙනෙක් සම්බන්ධ වුණා:', socket.id);

    // 4. අලුතෙන් සම්බන්ධ වන User ට කලින් ඇඳපු දේවල් Database එකෙන් ලබා දීම (Persistence)
    try {
        const previousStrokes = await Stroke.find().sort({ timestamp: 1 });
        socket.emit('load-history', previousStrokes);
    } catch (err) {
        console.error("History load කිරීමේදී දෝෂයක්:", err);
    }

    // 5. Drawing Data ලැබෙන විට
    socket.on('draw', async (data) => {
        // අඳින user හැර අනිත් අයට පණිවිඩය යැවීම
        socket.broadcast.emit('draw-on-whiteboard', data);

        // Database එකේ save කිරීම (Engineer Level Step!)
        try {
            const newStroke = new Stroke(data);
            await newStroke.save();
        } catch (err) {
            console.error("Save කිරීමේදී දෝෂයක්:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User ඉවත් වුණා');
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server එක port ${PORT} එකේ වැඩ... ✅`);
});