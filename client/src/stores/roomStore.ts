import { create } from 'zustand';

export interface Player {
  userId: string;
  username?: string;
  email?: string;
  socketId: string | null;
  status: 'connected' | 'disconnected';
  joinedAt: Date;
}

export interface Room {
  _id: string;
  code: string;
  host: {
    _id: string;
    username: string;
    email: string;
  };
  players: Player[];
  gameType: 'perudo' | 'codenames' | 'quiz';
  status: 'waiting' | 'in_game' | 'finished';
  maxPlayers: number;
  isPrivate: boolean;
  settings?: Record<string, any>;
  createdAt: string;
  playerCount?: number;
}

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setRooms: (rooms: Room[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,

  setRooms: (rooms) => set({ rooms }),

  setCurrentRoom: (room) => set({ currentRoom: room }),

  addRoom: (room) => set((state) => ({
    rooms: [room, ...state.rooms]
  })),

  updateRoom: (roomId, updates) => set((state) => ({
    rooms: state.rooms.map(room =>
      room._id === roomId ? { ...room, ...updates } : room
    ),
    currentRoom: state.currentRoom?._id === roomId
      ? { ...state.currentRoom, ...updates }
      : state.currentRoom
  })),

  removeRoom: (roomId) => set((state) => ({
    rooms: state.rooms.filter(room => room._id !== roomId),
    currentRoom: state.currentRoom?._id === roomId ? null : state.currentRoom
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  reset: () => set({
    rooms: [],
    currentRoom: null,
    isLoading: false,
    error: null
  })
}));
