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

      // まずユーザー情報を確認
      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log("User info:", userData);
        console.log("Product type:", userData.product);

        if (userData.product !== "premium") {
          console.error(
            "User does not have premium account:",
            userData.product
          );
          alert(
            `アカウントタイプ: ${userData.product}. Spotify Web Playback SDKを使用するにはプレミアムアカウントが必要です。`
          );
          return;
        }
      }

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

        // 403エラーの場合はプレミアムアカウントの問題の可能性
        if (response.status === 403) {
          alert(
            "デバイスの登録に失敗しました。Spotifyプレミアムアカウントが必要です。"
          );
        }
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
        console.error(
          "Access token first 20 chars:",
          accessToken?.substring(0, 20)
        );

        // トークンの有効性を確認
        fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              console.error("Token validation failed:", response.status);
              if (response.status === 401) {
                alert("認証トークンが無効です。再ログインしてください。");
                localStorage.removeItem("spotify_access_token");
                window.location.href = "/";
              }
            }
          })
          .catch((err) => console.error("Token validation error:", err));

        alert(
          `認証エラー: ${errorData.message}. プレミアムアカウントが必要です。`
        );
      });

      spotifyPlayer.addListener("account_error", (data) => {
        const errorData = data as { message: string };
        console.error("Failed to validate Spotify account:", errorData.message);
        alert(
          `アカウントエラー: ${errorData.message}. Spotifyプレミアムアカウントでログインしてください。`
        );
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
          // 少し遅延してからデバイスを登録
          setTimeout(() => {
            activateDevice(readyData.device_id, accessToken);
          }, 1000);
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
