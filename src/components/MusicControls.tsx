"use client";

import { useSpotifyStore } from "../store/spotify";
import styles from "./MusicControls.module.scss";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface Playlist {
  id: string;
  name: string;
  tracks: {
    total: number;
  };
  images: Array<{
    url: string;
  }>;
}

const MusicControls = () => {
  const { accessToken, deviceId, isPlaying, currentTrack } = useSpotifyStore();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

  // プレイリスト一覧を取得
  const fetchPlaylists = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.items);
      }
    } catch (error) {
      console.error("プレイリスト取得エラー:", error);
    }
  }, [accessToken]);

  // コンポーネントマウント時にプレイリストを取得
  useEffect(() => {
    if (accessToken) {
      fetchPlaylists();
    }
  }, [accessToken, fetchPlaylists]);

  // 選択されたプレイリストまたはデフォルト曲を再生
  const playSelectedMusic = async () => {
    if (!accessToken || !deviceId) {
      alert("Spotifyに接続してデバイスを設定してください");
      return;
    }

    if (selectedPlaylist) {
      // プレイリストを再生
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
              context_uri: `spotify:playlist:${selectedPlaylist}`,
            }),
          }
        );

        if (response.ok || response.status === 204) {
          alert("🎵 プレイリスト再生開始！");
        } else {
          const errorText = await response.text();
          console.error("再生エラー:", response.status, errorText);
          alert(`再生に失敗しました: ${response.status}`);
        }
      } catch (error) {
        console.error("再生エラー:", error);
        alert("再生エラーが発生しました");
      }
    } else {
      // デフォルトのテスト曲を再生
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
          alert("🎵 テスト曲再生開始！");
        } else {
          const errorText = await response.text();
          console.error("再生エラー:", response.status, errorText);
          alert(`再生に失敗しました: ${response.status}`);
        }
      } catch (error) {
        console.error("再生エラー:", error);
        alert("再生エラーが発生しました");
      }
    }
  };

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

  if (!accessToken || !deviceId) {
    return (
      <div className={styles.controlsContainer}>
        <p>Spotifyに接続してデバイスを設定してください...</p>
      </div>
    );
  }

  return (
    <div className={styles.controlsContainer}>
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
        <div className={styles.playlistSelector}>
          <button
            onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
            className={styles.testButton}
          >
            📁 プレイリストを選択
          </button>

          {showPlaylistSelector && (
            <div className={styles.playlistDropdown}>
              <select
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                className={styles.playlistSelect}
              >
                <option value="">デフォルト曲を選択</option>
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} ({playlist.tracks.total}曲)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button onClick={playSelectedMusic} className={styles.testButton}>
          🎵 {selectedPlaylist ? "プレイリスト再生" : "テスト再生 (Ed Sheeran)"}
        </button>
      </div>
    </div>
  );
};

export default MusicControls;
