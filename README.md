# 🎨 Collaborative Whiteboard Pro

A high-performance, real-time collaborative workspace built by **Kaveesha Hasaranga**. This application allows multiple users to draw, share ideas, and collaborate on a digital canvas simultaneously with zero latency.



---

## 🚀 Live Demo & Repository
- **GitHub Repository:** [kaveeshahasaranga/whiteboard-app](https://github.com/kaveeshahasaranga/whiteboard-app)
- **Author:** Kaveesha Hasaranga

---

## ✨ Key Features

- **Real-time Synchronization:** Powered by WebSockets (Socket.io) for instantaneous updates across all connected clients.
- **Advanced Drawing Tools:** Includes a professional toolbar with Pencil, Eraser, Shapes (Rectangles, Circles), and Sticky Notes.
- **Shared Presence:** Live user count and shared cursors allow you to see exactly where other collaborators are working.
- **Data Persistence:** Integrated with MongoDB Atlas to save and reload whiteboard history automatically.
- **Infinite Canvas Feel:** Expansive drawing area with responsive design for all screen sizes.
- **Export Options:** Download your masterpiece as a PNG image for easy sharing.
- **Modern UI:** Minimalist floating toolbar inspired by Microsoft Whiteboard.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Lucide Icons, CSS3
- **Backend:** Node.js, Express.js
- **Real-time Engine:** Socket.io
- **Database:** MongoDB Atlas (NoSQL)
- **DevOps:** Docker, Docker Compose
- **CI/CD:** GitHub Actions



---

## 🐳 Docker Deployment

The entire application is containerized for consistent deployment.

```bash
# To run the entire stack using Docker Compose
docker-compose up --build
