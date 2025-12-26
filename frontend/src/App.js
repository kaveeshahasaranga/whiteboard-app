import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Backend server එකට සම්බන්ධ වීම
const socket = io('http://localhost:5000');

function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000'); // Default පාට කළු

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('5d');

    // 1. Database එකේ තියෙන පරණ දත්ත load කිරීම
    socket.on('load-history', (history) => {
      history.forEach((data) => {
        drawOnCanvas(data.x, data.y, data.color, data.isNewStroke);
      });
    });

    // 2. වෙනත් අය අඳින දේවල් real-time පෙන්වීම
    socket.on('draw-on-whiteboard', (data) => {
      drawOnCanvas(data.x, data.y, data.color, data.isNewStroke);
    });

    return () => socket.off();
  }, []);

  const drawOnCanvas = (x, y, strokeColor, isNewStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (isNewStroke) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const startDrawing = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setIsDrawing(true);
    drawOnCanvas(x, y, color, true);
    socket.emit('draw', { x, y, color, isNewStroke: true });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    drawOnCanvas(x, y, color, false);
    socket.emit('draw', { x, y, color, isNewStroke: false });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <h2>Real-time Collaborative Whiteboard 🎨</h2>
      
      <div style={{ marginBottom: '15px', background: '#fff', padding: '10px', borderRadius: '10px', display: 'inline-block', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <label>Brush Color: </label>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
          style={{ cursor: 'pointer', marginRight: '20px' }}
        />
        
        <button 
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }}
          style={{ padding: '5px 15px', cursor: 'pointer', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Clear Board
        </button>
      </div>

      <br />
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: '2px solid #333', backgroundColor: '#fff', borderRadius: '8px', cursor: 'crosshair', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
      />
    </div>
  );
}

export default App;