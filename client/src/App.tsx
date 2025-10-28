import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Lobby from './components/lobby/Lobby';
import WaitingRoom from './components/room/WaitingRoom';
import GameView from './components/games/GameView';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  // Page d'authentification
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-bold text-gray-800 mb-4">
                🎮 Board Game Arena
              </h1>
              <p className="text-xl text-gray-600">
                Jouez à des jeux de société avec vos amis en temps réel
              </p>
            </div>

            {showRegister ? (
              <Register onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <Login onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </div>
        </div>
      </>
    );
  }

  // Application principale avec routing
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/lobby" className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 hover:text-primary-600 transition-colors">
                🎮 Board Game Arena
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-600">{user?.stats.gamesWon} victoires</p>
              </div>
              <button
                onClick={logout}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/room/:code" element={<WaitingRoom />} />
          <Route path="/game/:code" element={<GameView />} />
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
