"use client";

import { useEffect, useRef } from "react";
import { useSpotifyStore } from "../store/spotify";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
  uri: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
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
    _options: { getOAuthToken: (cb: (token: string) => void) => void };
  }
}

const SpotifyPlayer = () => {
  const {
    accessToken,
    setPlayer,
    setDeviceId,
    setIsPlaying,
    setCurrentTrack,
    setIsSDKReady,
  } = useSpotifyStore();

  const playerRef = useRef<SpotifyPlayer | null>(null);

  const activateDevice = async (deviceId: string, accessToken: string) => {
    try {
      console.log("Activating device:", deviceId);
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        console.error("Failed to activate device:", response.status, errorText);
      } else {
        console.log("Device activated successfully");
      }
    } catch (error) {
      console.error("Error activating device:", error);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSDKReady(true);

      const spotifyPlayer = new window.Spotify.Player({
        name: "Gesture Music Controller",
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      setPlayer(spotifyPlayer);
      playerRef.current = spotifyPlayer;

      spotifyPlayer.addListener("initialization_error", (data) => {
        const errorData = data as { message: string };
        console.error("Failed to initialize:", errorData.message);
      });

      spotifyPlayer.addListener("authentication_error", (data) => {
        const errorData = data as { message: string };
        console.error("Failed to authenticate:", errorData.message);
        alert("認証エラー：Spotifyプレミアムアカウントが必要です");
      });

      spotifyPlayer.addListener("account_error", (data) => {
        const errorData = data as { message: string };
        console.error("Failed to validate Spotify account:", errorData.message);
        alert("アカウントエラー：Spotifyプレミアムアカウントが必要です");
      });

      spotifyPlayer.addListener("playback_error", (data) => {
        const errorData = data as { message: string };
        console.error("Failed to perform playback:", errorData.message);
      });

      spotifyPlayer.addListener("player_state_changed", (data) => {
        const state = data as {
          track_window: { current_track: SpotifyTrack };
          paused: boolean;
        };
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      spotifyPlayer.addListener("ready", (data) => {
        const readyData = data as { device_id: string };
        console.log("Ready with Device ID", readyData.device_id);
        setDeviceId(readyData.device_id);
        setIsSDKReady(true);

        if (accessToken) {
          activateDevice(readyData.device_id, accessToken);
        }
      });

      spotifyPlayer.addListener("not_ready", (data) => {
        const notReadyData = data as { device_id: string };
        console.log("Device ID has gone offline:", notReadyData.device_id);
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [
    accessToken,
    setPlayer,
    setDeviceId,
    setIsPlaying,
    setCurrentTrack,
    setIsSDKReady,
  ]);

  if (!accessToken) {
    return null;
  }

  return (
    <div style={{ display: "none" }}>
      {/* このコンポーネントは見た目には表示されないが、Spotify SDKを管理する */}
    </div>
  );
};

export default SpotifyPlayer;
