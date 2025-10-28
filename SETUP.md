# 🚀 Setup Instructions

## Phase 1 Complete! ✅

The project structure has been created. Now let's install the dependencies.

## Next Steps

### 1. Install Root Dependencies

```bash
npm install
```

### 2. Install Server Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Install Client Dependencies

```bash
cd client
npm install
cd ..
```

**OR** install all at once from the root:

```bash
npm run install:all
```

### 4. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
cp .env.example .env
```

Then edit `server/.env` with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/board-game-arena

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

### 5. Test the Setup

Start the development servers:

```bash
# From the root directory
npm run dev
```

This will start:
- **Backend Server**: http://localhost:3000
- **Frontend Client**: http://localhost:5173

### 6. Verify Everything Works

- Open http://localhost:5173 in your browser
- You should see the "Board Game Arena" welcome page
- Check http://localhost:3000/api/health to verify the backend is running

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use, you can change it:

- **Backend**: Edit `server/.env` and change `PORT=3000` to another port
- **Frontend**: Edit `client/vite.config.ts` and change the `server.port` value

### Module Not Found Errors

Make sure all dependencies are installed:

```bash
npm run install:all
```

## What's Next?

✅ Phase 1 is complete!

👉 **Next**: Phase 2 - Database Setup and Models

See [ROADMAP.md](./ROADMAP.md) for the full development plan.
