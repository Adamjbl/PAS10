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

  setRooms: (rooms) => {
    console.log('🏪 [RoomStore] setRooms called', { count: rooms.length });
    set({ rooms });
  },

  setCurrentRoom: (room) => {
    set((state) => {
      // Si room est une fonction, l'appeler avec l'état actuel
      const newRoom = typeof room === 'function' ? room(state.currentRoom) : room;

      console.log('🏪 [RoomStore] setCurrentRoom called', {
        hasRoom: !!newRoom,
        roomCode: newRoom?.code,
        playersCount: newRoom?.players?.length,
        wasFunction: typeof room === 'function'
      });

      return { currentRoom: newRoom };
    });
  },

  addRoom: (room) => {
    console.log('🏪 [RoomStore] addRoom called', { roomCode: room.code });
    set((state) => ({
      rooms: [room, ...state.rooms]
    }));
  },

  updateRoom: (roomId, updates) => {
    console.log('🏪 [RoomStore] updateRoom called', { roomId, updates });
    set((state) => ({
      rooms: state.rooms.map(room =>
        room._id === roomId ? { ...room, ...updates } : room
      ),
      currentRoom: state.currentRoom?._id === roomId
        ? { ...state.currentRoom, ...updates }
        : state.currentRoom
    }));
  },

  removeRoom: (roomId) => {
    console.log('🏪 [RoomStore] removeRoom called', { roomId });
    set((state) => ({
      rooms: state.rooms.filter(room => room._id !== roomId),
      currentRoom: state.currentRoom?._id === roomId ? null : state.currentRoom
    }));
  },

  setLoading: (loading) => {
    console.log('🏪 [RoomStore] setLoading called', { loading });
    set({ isLoading: loading });
  },

  setError: (error) => {
    console.log('🏪 [RoomStore] setError called', { error });
    set({ error });
  },

  clearError: () => {
    console.log('🏪 [RoomStore] clearError called');
    set({ error: null });
  },

  reset: () => {
    console.log('🏪 [RoomStore] reset called');
    set({
      rooms: [],
      currentRoom: null,
      isLoading: false,
      error: null
    });
  }
}));
