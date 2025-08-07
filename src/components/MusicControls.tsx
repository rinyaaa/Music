"use client";

import { useSpotifyStore } from "../store/spotify";
import styles from "./MusicControls.module.scss";
import Image from "next/image";

const MusicControls = () => {
  const { accessToken, deviceId, isPlaying, currentTrack, player } =
    useSpotifyStore();

  // 全てSpotify Web APIで統一
  const togglePlayPause = async () => {
    if (!accessToken || !deviceId) return;

    try {
      const endpoint = isPlaying ? "pause" : "play";
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/${endpoint}?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok || response.status === 204) {
        console.log(`音楽を${isPlaying ? "停止" : "再生"}しました`);
      }
    } catch (error) {
      console.error("Toggle play/pause failed:", error);
    }
  };

  const skipToNext = async () => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok || response.status === 204) {
        console.log("次の曲に移動しました");
      }
    } catch (error) {
      console.error("Skip to next failed:", error);
    }
  };

  const skipToPrevious = async () => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok || response.status === 204) {
        console.log("前の曲に移動しました");
      }
    } catch (error) {
      console.error("Skip to previous failed:", error);
    }
  };

  const setVolume = async (volume: number) => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(
          volume * 100
        )}&device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok || response.status === 204) {
        console.log(`音量を${Math.round(volume * 100)}%に設定しました`);
      }
    } catch (error) {
      console.error("Set volume failed:", error);
    }
  };

  // 強制停止機能を追加
  const forceStop = async () => {
    if (!accessToken || !deviceId) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok || response.status === 204) {
        alert("🛑 音楽を強制停止しました");
      }
    } catch (error) {
      console.error("停止エラー:", error);
    }
  };

  // デバイス再アクティブ化機能
  const reactivateDevice = async () => {
    if (!accessToken || !deviceId) return;

    try {
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

      if (response.ok || response.status === 204) {
        alert("🔄 デバイスを再アクティブ化しました");
      }
    } catch (error) {
      console.error("再アクティブ化エラー:", error);
    }
  };

  const playTestPlaylist = async () => {
    if (!accessToken || !deviceId) {
      alert("Spotifyに接続してデバイスを設定してください");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: ["spotify:track:7qiZfU4dY1lWllzX7mPBI3"],
          }),
        }
      );

      if (response.ok || response.status === 204) {
        alert("🎵 再生開始！");
      } else {
        const errorText = await response.text();
        console.error("再生エラー:", response.status, errorText);
        alert(`再生に失敗しました: ${response.status}`);
      }
    } catch (error) {
      console.error("再生エラー:", error);
      alert("再生エラーが発生しました");
    }
  };

  if (!accessToken || !deviceId) {
    return (
      <div className={styles.controlsContainer}>
        <p>Spotifyに接続してデバイスを設定してください...</p>
      </div>
    );
  }

  return (
    <div className={styles.controlsContainer}>
      {/* 既存のUI部分はそのまま */}
      <div className={styles.trackInfo}>
        {currentTrack ? (
          <>
            <div className={styles.albumArt}>
              {currentTrack.album?.images?.[0] && (
                <Image
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
                  width={80}
                  height={80}
                />
              )}
            </div>
            <div className={styles.trackDetails}>
              <h3>{currentTrack.name}</h3>
              <p>
                {currentTrack.artists
                  ?.map((artist: { name: string }) => artist.name)
                  .join(", ")}
              </p>
            </div>
          </>
        ) : (
          <div className={styles.noTrack}>
            <p>再生中の曲がありません</p>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button onClick={skipToPrevious} className={styles.controlButton}>
          ⏮️
        </button>
        <button onClick={togglePlayPause} className={styles.playButton}>
          {isPlaying ? "⏸️" : "▶️"}
        </button>
        <button onClick={skipToNext} className={styles.controlButton}>
          ⏭️
        </button>
      </div>

      <div className={styles.volume}>
        <span>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className={styles.volumeSlider}
        />
      </div>

      <div className={styles.testControls}>
        <button onClick={playTestPlaylist} className={styles.testButton}>
          🎵 テスト再生 (Ed Sheeran)
        </button>
        <button onClick={forceStop} className={styles.testButton}>
          🛑 強制停止
        </button>
        <button onClick={reactivateDevice} className={styles.testButton}>
          🔄 デバイス再アクティブ化
        </button>
        <button
          onClick={() => {
            if (player) {
              player.getCurrentState().then((state) => {
                console.log("Current player state:", state);
                alert(
                  `プレイヤー状態: ${state ? "アクティブ" : "非アクティブ"}`
                );
              });
            }
          }}
          className={styles.testButton}
        >
          🔍 プレイヤー状態確認
        </button>
      </div>

      <div className={styles.status}>
        <p>デバイス: ブラウザ ({deviceId?.substring(0, 8)}...)</p>
        <p>ステータス: {isPlaying ? "再生中" : "停止中"}</p>
        <p>トークン: {accessToken ? "有効" : "無効"}</p>
        <p>プレイヤー: {player ? "接続済み" : "未接続"}</p>
      </div>
    </div>
  );
};

export default MusicControls;
