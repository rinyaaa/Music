import { create } from "zustand";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  uri: string;
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, callback: (data: unknown) => void): void;
  removeListener(event: string): void;
  getCurrentState(): Promise<unknown>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

interface SpotifyState {
  accessToken: string | null;
  deviceId: string | null;
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  player: SpotifyPlayer | null;
  isSDKReady: boolean;

  // Actions
  setAccessToken: (token: string | null) => void;
  setDeviceId: (deviceId: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTrack: (track: SpotifyTrack | null) => void;
  setPlayer: (player: SpotifyPlayer | null) => void;
  setIsSDKReady: (ready: boolean) => void;
}

export const useSpotifyStore = create<SpotifyState>((set) => ({
  accessToken: null,
  deviceId: null,
  isPlaying: false,
  currentTrack: null,
  player: null,
  isSDKReady: false,

  setAccessToken: (token) => set({ accessToken: token }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setPlayer: (player) => set({ player }),
  setIsSDKReady: (ready) => set({ isSDKReady: ready }),
}));
