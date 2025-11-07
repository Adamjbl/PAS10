import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, MessageCircle } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentPlayerId: string;
}

export function ChatPanel({ messages, onSendMessage, currentPlayerId }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
                ${msg.isSystem ? "text-center" : ""}
              `}
            >
              {msg.isSystem ? (
                <div className="text-slate-400 text-sm italic">
                  {msg.message}
                </div>
              ) : (
                <div
                  className={`
                    ${msg.playerId === currentPlayerId ? "ml-auto bg-purple-600/80" : "mr-auto bg-slate-700/80"}
                    max-w-[80%] rounded-lg p-3 space-y-1
                  `}
                >
                  <div className="text-xs text-slate-300">{msg.playerName}</div>
                  <div className="text-white">{msg.message}</div>
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
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Envoyer un message..."
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
