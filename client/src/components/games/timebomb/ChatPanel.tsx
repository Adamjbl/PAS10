import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../../../services/socket';
import { useAuthStore } from '../../../stores/authStore';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface ChatPanelProps {
  roomCode: string;
}

export function ChatPanel({ roomCode }: ChatPanelProps) {
  const { user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleMessage = (data: { userId: string; username: string; message: string; timestamp: Date }) => {
      console.log('💬 Chat message received:', data);
      const newMessage: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        userId: data.userId,
        username: data.username,
        message: data.message,
        timestamp: new Date(data.timestamp)
      };
      setMessages(prev => [...prev, newMessage]);
    };

    const handleGameEvent = (data: any) => {
      // Ajouter des messages système pour les événements de jeu
      if (data.event === 'defuse_cut') {
        const systemMessage: ChatMessage = {
          id: Date.now().toString() + Math.random(),
          userId: 'system',
          username: 'Système',
          message: `Câble de désamorçage coupé ! (${data.count}/4)`,
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev, systemMessage]);
      } else if (data.event === 'safe_cut') {
        const systemMessage: ChatMessage = {
          id: Date.now().toString() + Math.random(),
          userId: 'system',
          username: 'Système',
          message: 'Câble sûr coupé.',
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev, systemMessage]);
      } else if (data.event === 'game_won') {
        const systemMessage: ChatMessage = {
          id: Date.now().toString() + Math.random(),
          userId: 'system',
          username: 'Système',
          message: data.team === 'blue'
            ? '🎉 L\'équipe de Sherlock a gagné ! La bombe est désamorcée !'
            : '💣 L\'équipe de Moriarty a gagné ! La bombe a explosé !',
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    };

    socketService.on('room:message', handleMessage);
    socketService.on('game:event', handleGameEvent);

    return () => {
      socketService.off('room:message', handleMessage);
      socketService.off('game:event', handleGameEvent);
    };
  }, []);

  const handleSend = () => {
    if (inputValue.trim() && user) {
      socketService.sendMessage(roomCode, inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          Chat
        </h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`
                ${msg.isSystem ? 'text-center' : ''}
              `}
            >
              {msg.isSystem ? (
                <div className="text-slate-400 text-sm italic">
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`
                    ${msg.userId === user?._id ? 'ml-auto bg-purple-600/80' : 'mr-auto bg-slate-700/80'}
                    max-w-[80%] rounded-lg p-3 space-y-1
                  `}
                >
                  <div className="text-xs text-slate-300">{msg.username}</div>
                  <div className="text-white break-words">{msg.message}</div>
                  <div className="text-xs text-slate-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Envoyer un message..."
            className="flex-1 bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-400
                       px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg
                       flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
