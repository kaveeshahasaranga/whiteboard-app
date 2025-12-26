import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Backend එකට connect වීම
const socket = io('http://localhost:5000');

function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Server එකෙන් drawing data ලැබෙන කොට අඳින්න
    socket.on('draw-on-whiteboard', (data) => {
      draw(data.x, data.y, false);
    });
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e.nativeEvent.offsetX, e.nativeEvent.offsetY, false);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    draw(x, y, true);
    
    // Server එකට data යැවීම (මෙතනදී x සහ y යවනවා)
    socket.emit('draw', { x, y });
  };

  const draw = (x, y, isLocal) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isLocal ? 'blue' : 'red'; // තමන් අඳින ඒවා නිල්, අනිත් අයගේ ඒවා රතු

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Real-time Whiteboard</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ border: '2px solid black', cursor: 'crosshair' }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}

export default App;