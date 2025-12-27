const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

const server = http.createServer(app);

// 1. MongoDB Atlas සම්බන්ධතාවය
// ඔයාගේ password (white123) සහ Database එක (WhiteboardDB) නිවැරදිව ඇතුළත් කර ඇත.
const mongoURI = "mongodb+srv://whiteboard_user:white123@cluster0.d8h1vhe.mongodb.net/WhiteboardDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Atlas සමඟ සාර්ථකව සම්බන්ධ වුණා! ✅"))
    .catch(err => console.error("Database සම්බන්ධතාවයේ දෝෂයක්: ", err));

// 2. Data Schema එක (Pencil strokes, Shapes, සහ Sticky Notes සඳහා)
const StrokeSchema = new mongoose.Schema({
    type: String,        // sticky, pencil, rect, circle
    x: Number,           // pencil/eraser සඳහා
    y: Number,
    start: Object,       // shapes සඳහා {x, y}
    end: Object,         // shapes සඳහා {x, y}
    color: String,
    width: Number,
    text: String,        // sticky notes සඳහා
    id: Number,          // sticky notes සඳහා unique id
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
    console.log('User සම්බන්ධ වුණා:', socket.id);

    // 4. සජීවී පරිශීලකයන් ගණන සියලු දෙනාටම යැවීම
    io.emit('user-count', io.engine.clientsCount);

    // 5. කලින් ඇඳපු දත්ත (History) Database එකෙන් ලබා දී Frontend එකේ පෙන්වීම
    try {
        const history = await Stroke.find().sort({ timestamp: 1 });
        socket.emit('load-history', history);
    } catch (err) {
        console.error("History load කිරීමේදී දෝෂයක්:", err);
    }

    // 6. දත්ත ලැබෙන විට ඒවා අනිත් අයට යැවීම සහ Save කිරීම
    socket.on('draw', async (data) => {
        // අඳින user හැර අනිත් හැමෝටම දත්ත යවනවා (Broadcast)
        socket.broadcast.emit('draw-on-whiteboard', data);

        // Database එකේ save කිරීම
        try {
            const newEntry = new Stroke(data);
            await newEntry.save();
        } catch (err) {
            console.error("දත්ත Save කිරීමේදී දෝෂයක්:", err);
        }
    });

    // 7. Cursor චලනය වන විට එය අන් අයට යැවීම (මෙය DB එකේ save කරන්නේ නැත)
    socket.on('cursor-move', (data) => {
        socket.broadcast.emit('cursor-move', data);
    });

    socket.on('disconnect', () => {
        console.log('User ඉවත් වුණා');
        // යම් අයෙක් ඉවත් වූ විට නැවත පරිශීලක ගණන යාවත්කාලීන කිරීම
        io.emit('user-count', io.engine.clientsCount);
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Backend Server එක port ${PORT} එකේ වැඩ... ✅`);
});