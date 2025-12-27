import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Pencil, Square, Circle, StickyNote, Eraser, Trash2, 
  Download, MousePointer2, Minus, Plus, Undo, Redo, 
  Maximize, Users 
} from 'lucide-react';

const socket = io('http://localhost:5000');

function App() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cursors, setCursors] = useState({});
  const [stickies, setStickies] = useState([]);
  const [userCount, setUserCount] = useState(1);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    socket.on('load-history', (data) => {
      data.forEach(item => {
        if (item.type === 'sticky') setStickies(prev => [...prev, item]);
        else draw(canvasRef.current, item);
      });
    });

    socket.on('draw-on-whiteboard', (data) => draw(canvasRef.current, data));
    socket.on('cursor-move', (data) => setCursors(prev => ({ ...prev, [data.userId]: data.position })));
    socket.on('user-count', (count) => setUserCount(count));

    return () => socket.off();
  }, []);

  const draw = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (data.tool === 'pencil' || data.tool === 'eraser') {
      if (data.isNewStroke) {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
      } else {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
    } else if (data.tool === 'rect') {
      ctx.strokeRect(data.start.x, data.start.y, data.end.x - data.start.x, data.end.y - data.start.y);
    } else if (data.tool === 'circle') {
      const radius = Math.sqrt(Math.pow(data.end.x - data.start.x, 2) + Math.pow(data.end.y - data.start.y, 2));
      ctx.beginPath();
      ctx.arc(data.start.x, data.start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleMouseDown = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'sticky') {
      const newSticky = { type: 'sticky', x, y, text: '', color: '#fff9c4', id: Date.now() };
      setStickies(prev => [...prev, newSticky]);
      socket.emit('draw', newSticky);
    } else if (tool === 'pencil' || tool === 'eraser') {
      const drawData = { x, y, color: tool === 'eraser' ? '#ffffff' : color, width: lineWidth, isNewStroke: true, tool };
      draw(canvasRef.current, drawData);
      socket.emit('draw', drawData);
    }
  };

  const handleMouseMove = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    socket.emit('cursor-move', { userId: socket.id, position: { x, y } });

    if (!isDrawing) return;

    if (tool === 'pencil' || tool === 'eraser') {
      const drawData = { x, y, color: tool === 'eraser' ? '#ffffff' : color, width: lineWidth, isNewStroke: false, tool };
      draw(canvasRef.current, drawData);
      socket.emit('draw', drawData);
    } else {
      const overlayCtx = overlayRef.current.getContext('2d');
      overlayCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      draw(overlayRef.current, { tool, start: startPos, end: { x, y }, color, width: lineWidth });
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setIsDrawing(false);

    if (tool === 'rect' || tool === 'circle') {
      const drawData = { tool, start: startPos, end: { x, y }, color, width: lineWidth };
      draw(canvasRef.current, drawData);
      overlayRef.current.getContext('2d').clearRect(0, 0, window.innerWidth, window.innerHeight);
      socket.emit('draw', drawData);
    }
  };

  const downloadCanvas = () => {
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', backgroundColor: '#f9fafb' }}>
      
      {/* Top Info Bar */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, display: 'flex', gap: '10px' }}>
        <div style={infoBadgeStyle}><Users size={16}/> {userCount} Active</div>
        <div style={infoBadgeStyle}>Collaborative Canvas Pro</div>
      </div>

      {/* --- Bottom Center Toolbar --- */}
      <div style={toolbarStyle}>
        <ToolbarButton active={tool === 'pencil'} onClick={() => setTool('pencil')} icon={<Pencil size={20}/>} />
        <ToolbarButton active={tool === 'rect'} onClick={() => setTool('rect')} icon={<Square size={20}/>} />
        <ToolbarButton active={tool === 'circle'} onClick={() => setTool('circle')} icon={<Circle size={20}/>} />
        <ToolbarButton active={tool === 'sticky'} onClick={() => setTool('sticky')} icon={<StickyNote size={20}/>} />
        <ToolbarButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={20}/>} />
        
        <div style={dividerStyle} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={colorPickerStyle} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button onClick={() => setLineWidth(Math.max(1, lineWidth-1))} style={smallBtnStyle}><Minus size={14}/></button>
            <span style={{ fontSize: '12px', width: '20px', textAlign: 'center' }}>{lineWidth}</span>
            <button onClick={() => setLineWidth(Math.min(20, lineWidth+1))} style={smallBtnStyle}><Plus size={14}/></button>
        </div>

        <div style={dividerStyle} />
        <ToolbarButton onClick={downloadCanvas} icon={<Download size={20}/>} />
        <ToolbarButton onClick={() => window.location.reload()} icon={<Trash2 size={20} color="#ef4444"/>} />
      </div>

      {/* Cursors Layer */}
      {Object.entries(cursors).map(([id, pos]) => id !== socket.id && (
        <div key={id} style={{ position: 'absolute', left: pos.x, top: pos.y, pointerEvents: 'none', zIndex: 50 }}>
          <MousePointer2 size={18} fill="#3b82f6" color="white" />
          <span style={userNameStyle}>User_{id.slice(0,3)}</span>
        </div>
      ))}

      {/* Sticky Notes Layer */}
      {stickies.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: s.x, top: s.y, width: '160px', height: '160px', backgroundColor: s.color, padding: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '2px', zIndex: 10 }}>
          <textarea placeholder="Type here..." style={stickyTextStyle} />
        </div>
      ))}

      {/* Canvas Layers */}
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'white' }} />
      <canvas ref={overlayRef} width={window.innerWidth} height={window.innerHeight} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} style={{ position: 'absolute', top: 0, left: 0, cursor: 'crosshair' }} />
    </div>
  );
}

// Styles
const toolbarStyle = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', zIndex: 100 };
const ToolbarButton = ({ active, onClick, icon }) => (
  <button onClick={onClick} style={{ border: 'none', backgroundColor: active ? '#f0f7ff' : 'transparent', color: active ? '#3b82f6' : '#6b7280', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' }}>{icon}</button>
);
const infoBadgeStyle = { backgroundColor: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const colorPickerStyle = { width: '30px', height: '30px', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, overflow: 'hidden' };
const dividerStyle = { width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 10px' };
const smallBtnStyle = { border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '5px', padding: '2px', cursor: 'pointer' };
const userNameStyle = { position: 'absolute', top: '20px', left: '10px', backgroundColor: '#3b82f6', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' };
const stickyTextStyle = { width: '100%', height: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '14px', lineHeight: '1.4' };

export default App;