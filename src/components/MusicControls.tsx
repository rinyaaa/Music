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
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

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
        setHighlightedIndex(0); // プレイリストを取得したら最初のアイテムをハイライト
      }
    } catch (error) {
      console.error("プレイリスト取得エラー:", error);
    }
  }, [accessToken]);

  // プレイリストを選択してモーダルを閉じる
  const selectPlaylist = useCallback(
    async (playlistId: string) => {
      setSelectedPlaylist(playlistId);
      setShowPlaylistModal(false);

      // プレイリスト選択後、自動で再生を開始
      if (playlistId && accessToken && deviceId) {
        try {
          await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                context_uri: `spotify:playlist:${playlistId}`,
              }),
            }
          );
        } catch (error) {
          console.error("再生エラー:", error);
          alert("再生エラーが発生しました");
        }
      }
    },
    [accessToken, deviceId]
  );

  const navigatePrevious = useCallback(() => {
    if (playlists.length === 0) return;
    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : playlists.length - 1));
  }, [playlists.length]);

  const navigateNext = useCallback(() => {
    if (playlists.length === 0) return;
    setHighlightedIndex((prev) => (prev < playlists.length - 1 ? prev + 1 : 0));
  }, [playlists.length]);

  const selectHighlighted = useCallback(() => {
    if (playlists.length > 0 && playlists[highlightedIndex]) {
      selectPlaylist(playlists[highlightedIndex].id);
    }
  }, [playlists, highlightedIndex, selectPlaylist]);

  // コンポーネントマウント時にプレイリストを取得
  useEffect(() => {
    if (accessToken) {
      fetchPlaylists();
    }
  }, [accessToken, fetchPlaylists]);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!showPlaylistModal) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          navigatePrevious();
          break;
        case "ArrowRight":
          event.preventDefault();
          navigateNext();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          selectHighlighted();
          break;
        case "Escape":
          event.preventDefault();
          setShowPlaylistModal(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [showPlaylistModal, navigatePrevious, navigateNext, selectHighlighted]);

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
                  width={500}
                  height={500}
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

      <div className={styles.testControls}>
        <div className={styles.playlistSelector}>
          <button
            onClick={() => setShowPlaylistModal(true)}
            className={styles.testButton}
          >
            📁 プレイリストを選択
          </button>
        </div>
      </div>

      {/* プレイリスト選択モーダル */}
      {showPlaylistModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowPlaylistModal(false)}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>プレイリストを選択</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowPlaylistModal(false)}
              >
                ✕
              </button>
            </div>

            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.playlistGrid}>
                {/* ユーザーのプレイリスト */}
                {playlists.map((playlist, index) => (
                  <div
                    key={playlist.id}
                    className={`${styles.playlistCard} ${
                      selectedPlaylist === playlist.id ? styles.selected : ""
                    } ${highlightedIndex === index ? styles.highlighted : ""}`}
                    onClick={() => {
                      setHighlightedIndex(index);
                      selectPlaylist(playlist.id);
                    }}
                  >
                    <div className={styles.playlistIcon}>
                      {playlist.images?.[0] ? (
                        <Image
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          width={60}
                          height={60}
                          className={styles.playlistImage}
                        />
                      ) : (
                        <span className={styles.defaultIcon}>🎶</span>
                      )}
                    </div>
                    <div className={styles.playlistInfo}>
                      <h4>{playlist.name}</h4>
                      <p>{playlist.tracks.total}曲</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.navigationControls}>
                <button onClick={navigatePrevious} className={styles.navButton}>
                  前へ
                </button>
                <button
                  onClick={selectHighlighted}
                  className={styles.selectButton}
                >
                  決定
                </button>
                <button onClick={navigateNext} className={styles.navButton}>
                  次へ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicControls;
