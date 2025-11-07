import { useState, useEffect } from "react";
import { GameLobby } from "./components/GameLobby";
import { GameBoard } from "./components/GameBoard";
import { RoleReveal, Role } from "./components/RoleReveal";
import { WireType } from "./components/WireCard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";

type GamePhase = "lobby" | "role-reveal" | "playing" | "game-over";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface Wire {
  playerId: string;
  wireIndex: number;
  revealed: boolean;
  type?: WireType;
}

interface GamePlayer extends Player {
  isAlive: boolean;
  wiresRemaining: number;
  wires: Wire[];
  role: Role;
  team: "blue" | "red";
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>("lobby");
  const [roomCode] = useState("TB-" + Math.random().toString(36).substring(2, 6).toUpperCase());
  const [currentPlayerId] = useState("player-1");
  
  // Lobby state
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([
    { id: "player-1", name: "Vous", isHost: true },
    { id: "player-2", name: "Alice", isHost: false },
    { id: "player-3", name: "Bob", isHost: false },
    { id: "player-4", name: "Charlie", isHost: false },
  ]);

  // Game state
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [defuseCount, setDefuseCount] = useState(0);
  const [bombCount, setBombCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [winner, setWinner] = useState<"blue" | "red" | null>(null);
  const [currentPlayerRole, setCurrentPlayerRole] = useState<{ role: Role; team: "blue" | "red" } | null>(null);

  // Initialize game
  const initializeGame = () => {
    const playerCount = lobbyPlayers.length;
    
    // Assign roles based on player count
    const roles: Array<{ role: Role; team: "blue" | "red" }> = [];
    
    // For 4-5 players: 1 Sherlock, 1 Moriarty, rest innocents (split evenly)
    if (playerCount <= 5) {
      roles.push({ role: "sherlock", team: "blue" });
      roles.push({ role: "moriarty", team: "red" });
      const blueInnocents = Math.floor((playerCount - 2) / 2);
      const redInnocents = playerCount - 2 - blueInnocents;
      for (let i = 0; i < blueInnocents; i++) roles.push({ role: "innocent", team: "blue" });
      for (let i = 0; i < redInnocents; i++) roles.push({ role: "innocent", team: "red" });
    } else {
      // For 6-8 players
      roles.push({ role: "sherlock", team: "blue" });
      roles.push({ role: "moriarty", team: "red" });
      const blueInnocents = Math.floor((playerCount - 2) * 0.6);
      const redInnocents = playerCount - 2 - blueInnocents;
      for (let i = 0; i < blueInnocents; i++) roles.push({ role: "innocent", team: "blue" });
      for (let i = 0; i < redInnocents; i++) roles.push({ role: "innocent", team: "red" });
    }
    
    // Shuffle roles
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    
    // Create game players with wires
    const newGamePlayers: GamePlayer[] = lobbyPlayers.map((player, index) => {
      const roleInfo = shuffledRoles[index];
      const wiresPerPlayer = 4;
      
      // Generate wires for this player
      const wires: Wire[] = [];
      const wireTypes: WireType[] = [];
      
      // Distribute wires based on team
      if (roleInfo.team === "blue") {
        // Blue team gets 1 defuse wire and 3 safe wires
        wireTypes.push("defuse");
        for (let i = 0; i < wiresPerPlayer - 1; i++) wireTypes.push("safe");
      } else {
        // Red team gets 1 bomb wire and 3 safe wires
        if (roleInfo.role === "moriarty") {
          wireTypes.push("bomb");
          for (let i = 0; i < wiresPerPlayer - 1; i++) wireTypes.push("safe");
        } else {
          // Red innocents get all safe wires
          for (let i = 0; i < wiresPerPlayer; i++) wireTypes.push("safe");
        }
      }
      
      // Shuffle wire types
      const shuffledWireTypes = wireTypes.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < wiresPerPlayer; i++) {
        wires.push({
          playerId: player.id,
          wireIndex: i,
          revealed: false,
          type: shuffledWireTypes[i]
        });
      }
      
      return {
        ...player,
        isAlive: true,
        wiresRemaining: wiresPerPlayer,
        wires,
        role: roleInfo.role,
        team: roleInfo.team
      };
    });
    
    setGamePlayers(newGamePlayers);
    setCurrentTurnIndex(0);
    setDefuseCount(0);
    setBombCount(0);
    
    // Set current player's role
    const currentPlayer = newGamePlayers.find(p => p.id === currentPlayerId);
    if (currentPlayer) {
      setCurrentPlayerRole({ role: currentPlayer.role, team: currentPlayer.team });
    }
    
    // Add system message
    addSystemMessage("La partie commence ! Révélez votre rôle.");
  };

  const startGame = () => {
    initializeGame();
    setGamePhase("role-reveal");
  };

  const acknowledgeRole = () => {
    setGamePhase("playing");
    addSystemMessage("La partie a commencé ! Bonne chance !");
  };

  const addSystemMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: "system",
      playerName: "Système",
      message,
      timestamp: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const cutWire = (playerId: string, wireIndex: number) => {
    const currentPlayer = gamePlayers[currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== currentPlayerId || playerId !== currentPlayerId) {
      toast.error("Ce n'est pas votre tour ou vous ne pouvez pas couper ce câble !");
      return;
    }

    setGamePlayers(prev => {
      const updated = prev.map(player => {
        if (player.id === playerId) {
          const updatedWires = player.wires.map(wire => {
            if (wire.wireIndex === wireIndex && !wire.revealed) {
              return { ...wire, revealed: true };
            }
            return wire;
          });
          
          const remaining = updatedWires.filter(w => !w.revealed).length;
          
          return {
            ...player,
            wires: updatedWires,
            wiresRemaining: remaining,
            isAlive: remaining > 0
          };
        }
        return player;
      });
      
      // Check the cut wire
      const wire = updated.find(p => p.id === playerId)?.wires.find(w => w.wireIndex === wireIndex);
      
      if (wire?.type === "defuse") {
        setDefuseCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 4) {
            setWinner("blue");
            setGamePhase("game-over");
            addSystemMessage("🎉 L'équipe de Sherlock a gagné ! La bombe est désamorcée !");
            toast.success("Victoire de l'équipe bleue !");
          } else {
            addSystemMessage(`Câble de désamorçage coupé ! (${newCount}/4)`);
            toast.success("Câble de désamorçage !");
          }
          return newCount;
        });
      } else if (wire?.type === "bomb") {
        setBombCount(prev => {
          const newCount = prev + 1;
          setWinner("red");
          setGamePhase("game-over");
          addSystemMessage("💣 L'équipe de Moriarty a gagné ! La bombe a explosé !");
          toast.error("La bombe a explosé !");
          return newCount;
        });
      } else {
        addSystemMessage("Câble sûr coupé.");
        toast.info("Câble sûr");
      }
      
      return updated;
    });

    // Move to next player
    setCurrentTurnIndex(prev => {
      let next = (prev + 1) % gamePlayers.length;
      let attempts = 0;
      while (!gamePlayers[next].isAlive && attempts < gamePlayers.length) {
        next = (next + 1) % gamePlayers.length;
        attempts++;
      }
      return next;
    });
  };

  const sendMessage = (message: string) => {
    const player = gamePlayers.find(p => p.id === currentPlayerId) || lobbyPlayers.find(p => p.id === currentPlayerId);
    if (!player) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentPlayerId,
      playerName: player.name,
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const newGame = () => {
    setGamePhase("lobby");
    setGamePlayers([]);
    setMessages([]);
    setDefuseCount(0);
    setBombCount(0);
    setWinner(null);
    setCurrentPlayerRole(null);
  };

  return (
    <>
      <Toaster />
      {gamePhase === "lobby" && (
        <GameLobby
          onStartGame={startGame}
          players={lobbyPlayers}
          currentPlayer={lobbyPlayers.find(p => p.id === currentPlayerId)!}
          roomCode={roomCode}
        />
      )}

      {gamePhase === "role-reveal" && currentPlayerRole && (
        <RoleReveal
          role={currentPlayerRole.role}
          team={currentPlayerRole.team}
          onAcknowledge={acknowledgeRole}
        />
      )}

      {(gamePhase === "playing" || gamePhase === "game-over") && (
        <GameBoard
          players={gamePlayers}
          currentPlayerId={currentPlayerId}
          currentTurnPlayerId={gamePlayers[currentTurnIndex]?.id}
          defuseCount={defuseCount}
          bombCount={bombCount}
          messages={messages}
          onCutWire={cutWire}
          onSendMessage={sendMessage}
          gameOver={gamePhase === "game-over"}
          winner={winner || undefined}
          onNewGame={newGame}
        />
      )}
    </>
  );
}
