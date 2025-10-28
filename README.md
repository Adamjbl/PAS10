# 🎮 Board Game Arena

A modern online platform for playing board games with friends in real-time.

## 🎯 Features

- **Real-time Multiplayer**: Play with friends using WebSocket technology
- **Multiple Games**: Perudo, Codenames, Quiz, and more
- **Friend System**: Add friends and invite them to private rooms
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Secure Authentication**: JWT-based authentication system

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Socket.io Client** for real-time communication

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.io** for WebSocket communication
- **MongoDB** with Mongoose for database
- **JWT** for authentication

## 📁 Project Structure

```
board-game-arena/
├── client/          # React frontend application
├── server/          # Node.js backend server
├── shared/          # Shared types and utilities
├── ROADMAP.md       # Development roadmap
└── package.json     # Root package.json with monorepo scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd board-game-arena
```

2. Install dependencies for all projects:
```bash
npm run install:all
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the `server/` directory
   - Configure your MongoDB connection and JWT secret

4. Start development servers:
```bash
npm run dev
```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3000) servers.

## 📖 Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:client` - Start only the frontend
- `npm run dev:server` - Start only the backend
- `npm run build` - Build both projects for production
- `npm run install:all` - Install dependencies for all projects

## 🎮 Games

### Currently Available
- **Perudo** (Liar's Dice) - Bluffing dice game

### Coming Soon
- **Codenames** - Word association team game
- **Quiz** - Trivia quiz game

## 🗺️ Development Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development progress and upcoming features.

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Created with ❤️ by [Your Name]
