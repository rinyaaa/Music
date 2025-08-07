"use client";

import { useSpotifyStore } from "../store/spotify";
import styles from "./MusicControls.module.scss";

const MusicControls = () => {
  const { accessToken, deviceId, isPlaying, currentTrack, player } =
    useSpotifyStore();

  // Spotify Web APIを使用した音楽制御
  const spotifyApi = async (
    endpoint: string,
    method: string = "POST",
    body?: Record<string, unknown>
  ) => {
    if (!accessToken) {
      console.error("Access token is missing");
      return null;
    }

    try {
      const url = endpoint
        ? `https://api.spotify.com/v1/me/player/${endpoint}`
        : `https://api.spotify.com/v1/me/player`;

      console.log(`Making API call: ${method} ${url}`, body);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log(`API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Spotify API error: ${response.status} ${response.statusText}`,
          errorText
        );
        return null;
      }

      // 一部のエンドポイントは空のレスポンスを返す
      if (response.status === 204) {
        return null;
      }

      try {
        return await response.json();
      } catch {
        return null;
      }
    } catch (error) {
      console.error("Spotify API call failed:", error);
      return null;
    }
  };

  const togglePlayPause = async () => {
    if (!player) return;

    try {
      await player.togglePlay();
    } catch (error) {
      console.error("Toggle play/pause failed:", error);
    }
  };

  const skipToNext = async () => {
    if (!player) return;

    try {
      await player.nextTrack();
    } catch (error) {
      console.error("Skip to next failed:", error);
    }
  };

  const skipToPrevious = async () => {
    if (!player) return;

    try {
      await player.previousTrack();
    } catch (error) {
      console.error("Skip to previous failed:", error);
    }
  };

  const setVolume = async (volume: number) => {
    if (!player) return;

    try {
      await player.setVolume(volume);
    } catch (error) {
      console.error("Set volume failed:", error);
    }
  };

  // テスト用のプレイリスト再生
  const playTestPlaylist = async () => {
    console.log("Testing playback...");
    console.log("Device ID:", deviceId);
    console.log("Access Token:", accessToken ? "Present" : "Missing");

    if (!accessToken || !deviceId) {
      console.error("Missing access token or device ID");
      alert("Spotifyに接続してデバイスを設定してください");
      return;
    }

    try {
      // ステップ1: デバイスをアクティブにする
      console.log("Step 1: Activating device...");
      const activateResponse = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false,
          }),
        }
      );

      if (!activateResponse.ok && activateResponse.status !== 204) {
        const errorText = await activateResponse.text();
        console.error(
          "Device activation failed:",
          activateResponse.status,
          errorText
        );
      } else {
        console.log("Device activated successfully");
      }

      // ステップ2: 少し待ってから再生
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Step 2: Starting playback...");
      const playResponse = await fetch(
        "https://api.spotify.com/v1/me/player/play",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"], // Never Gonna Give You Up
          }),
        }
      );

      if (!playResponse.ok) {
        const errorText = await playResponse.text();
        console.error("Playback failed:", playResponse.status, errorText);

        // もし404エラーなら、代替方法を試す
        if (playResponse.status === 404) {
          console.log("Trying alternative method with device_id in body...");
          await tryPlaybackWithDeviceId();
        } else {
          alert(`再生に失敗しました: ${playResponse.status} ${errorText}`);
        }
      } else {
        console.log("Playback started successfully");
        alert("再生を開始しました！");
      }
    } catch (error) {
      console.error("Playback error:", error);
      alert("再生エラーが発生しました");
    }
  };

  // デバイスIDを明示的に指定した再生を試す
  const tryPlaybackWithDeviceId = async () => {
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
            uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Alternative playback failed:",
          response.status,
          errorText
        );
        alert(
          `再生に失敗しました（代替方法）: ${response.status} ${errorText}`
        );
      } else {
        console.log("Alternative playback started successfully");
        alert("再生を開始しました（代替方法）！");
      }
    } catch (error) {
      console.error("Alternative playback error:", error);
      alert("代替再生方法でもエラーが発生しました");
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
                <img
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
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
          🎵 テスト再生 (Rick Roll)
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
