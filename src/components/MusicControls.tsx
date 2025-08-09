"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./MusicControls.module.scss";
import { useSpotifyStore } from "../store/spotify";
import type { AccelSample } from "@/lib/xiaoBle";

interface Playlist {
  id: string;
  name: string;
  tracks: { total: number };
  images: Array<{ url: string }>;
}

/** props（page.tsx から渡す） */
export type MusicControlsProps = {
  sample: AccelSample | null;
  status?: string;
};

const MusicControls: React.FC<MusicControlsProps> = ({ sample, status }) => {
  const { accessToken, deviceId, isPlaying, currentTrack } = useSpotifyStore();
  const router = useRouter();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  /* ========== Spotify API ========== */
  const fetchPlaylists = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await fetch("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (r.ok) {
        const data = await r.json();
        setPlaylists(data.items);
        setHighlightedIndex(0);
      }
    } catch (e) {
      console.error("プレイリスト取得エラー:", e);
    }
  }, [accessToken]);

  const selectPlaylist = useCallback(
    async (playlistId: string) => {
      setSelectedPlaylist(playlistId);
      setShowPlaylistModal(false);
      if (!playlistId || !accessToken || !deviceId) return;
      try {
        const r = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
          }
        );
        if (r.status === 401) return alert("認証が切れました。再ログインしてください。");
        if (r.status === 403) return alert("この機能はプレミアム限定です。");
        if (r.status === 404)
          return alert("アクティブなデバイスが見つかりません。Spotifyアプリで再生してください。");
        if (!(r.ok || r.status === 204)) {
          console.error("再生エラー:", r.status, await r.text());
          alert(`再生エラー (${r.status})`);
        }
      } catch (e) {
        console.error("再生エラー:", e);
        alert("ネットワークエラーが発生しました");
      }
    },
    [accessToken, deviceId]
  );

  const navigatePrevious = useCallback(() => {
    if (playlists.length === 0) return;
    setHighlightedIndex((p) => (p > 0 ? p - 1 : playlists.length - 1));
  }, [playlists.length]);

  const navigateNext = useCallback(() => {
    if (playlists.length === 0) return;
    setHighlightedIndex((p) => (p < playlists.length - 1 ? p + 1 : 0));
  }, [playlists.length]);

  const selectHighlighted = useCallback(() => {
    if (playlists.length > 0 && playlists[highlightedIndex]) {
      selectPlaylist(playlists[highlightedIndex].id);
    }
  }, [playlists, highlightedIndex, selectPlaylist]);

  useEffect(() => {
    if (accessToken) fetchPlaylists();
  }, [accessToken, fetchPlaylists]);

  const togglePlayPause = async () => {
    if (!accessToken || !deviceId) return;
    try {
      const endpoint = isPlaying ? "pause" : "play";
      const r = await fetch(
        `https://api.spotify.com/v1/me/player/${endpoint}?device_id=${deviceId}`,
        { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (r.status === 401) {
        alert("認証が切れました。再ログインしてください。");
        localStorage.removeItem("spotify_access_token");
        window.location.reload();
        return;
      }
      if (r.status === 403) return alert("この機能はプレミアム限定です。");
      if (r.status === 404)
        return alert("アクティブなデバイスが見つかりません。Spotifyアプリで再生してください。");
      if (!(r.ok || r.status === 204)) {
        console.error("API エラー:", r.status, await r.text());
        alert(`エラー (${r.status})`);
      }
    } catch (e) {
      console.error("Toggle play/pause failed:", e);
      alert("ネットワークエラーが発生しました");
    }
  };

  const skipToNext = async () => {
    if (!accessToken || !deviceId) return;
    try {
      const r = await fetch(
        `https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`,
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (r.status === 401) return alert("認証が切れました。再ログインしてください。");
      if (r.status === 403) return alert("この機能はプレミアム限定です。");
      if (!(r.ok || r.status === 204)) {
        console.error("Skip next エラー:", r.status);
        alert(`エラー (${r.status})`);
      }
    } catch (e) {
      console.error("Skip to next failed:", e);
      alert("ネットワークエラーが発生しました");
    }
  };

  const skipToPrevious = async () => {
    if (!accessToken || !deviceId) return;
    try {
      const r = await fetch(
        `https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`,
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (r.status === 401) return alert("認証が切れました。再ログインしてください。");
      if (r.status === 403) return alert("この機能はプレミアム限定です。");
      if (!(r.ok || r.status === 204)) {
        console.error("Skip previous エラー:", r.status);
        alert(`エラー (${r.status})`);
      }
    } catch (e) {
      console.error("Skip to previous failed:", e);
      alert("ネットワークエラーが発生しました");
    }
  };

  /* ========== ここから「元JS同等」の判定ロジック ========== */

  // 固定パラメータ（script.jsのスクショ準拠）
  const TH_HI = 0.45;   // 発火しきい値 (g)
  const TH_LO = 0.25;   // 解除しきい値 (g)
  const HPF_FC = 2.3;   // HPFカットオフ (Hz)
  const LPF_FC = 0.5;   // LPFカットオフ (Hz) …重力推定
  const UD_SCALE = 2.2; // 上下強調
  const UD_DOM = 1.8;   // 縦優位条件: |hx*UD_SCALE| >= UD_DOM * |hy|
  const UD_REFRACT_MS = 600; // 上下後ブロック時間
  const LR_REFRACT_MS = 600; // 左右後ブロック（相互ブロック対称に）

  // サンプリング周期（XIAO 50Hz想定）
  const SAMPLE_DT = 0.02;

  // HPF: y[n] = α ( y[n-1] + x[n] - x[n-1] ), α = RC/(RC+dt)
  function makeHPF(fc: number) {
    const RC = 1 / (2 * Math.PI * fc);
    const alpha = RC / (RC + SAMPLE_DT);
    let yPrev = 0;
    let xPrev = 0;
    return (x: number) => {
      const y = alpha * (yPrev + x - xPrev);
      yPrev = y;
      xPrev = x;
      return y;
    };
  }

  // LPF: y[n] = y[n-1] + β ( x[n] - y[n-1] ), β = dt/(RC+dt)
  function makeLPF(fc: number) {
    const RC = 1 / (2 * Math.PI * fc);
    const beta = SAMPLE_DT / (RC + SAMPLE_DT);
    let yPrev = 0;
    return (x: number) => {
      const y = yPrev + beta * (x - yPrev);
      yPrev = y;
      return y;
    };
  }

  // フィルタ（重力推定→HPF）
  const lpfX = useRef(makeLPF(LPF_FC));
  const lpfY = useRef(makeLPF(LPF_FC));
  const hpfX = useRef(makeHPF(HPF_FC));
  const hpfY = useRef(makeHPF(HPF_FC));

  // ヒステリシス状態
  const lrState = useRef<"L" | "R" | null>(null);
  const udState = useRef<"U" | "D" | null>(null);

  // 相互ブロック用のタイムスタンプ
  const lastUD = useRef(0);
  const lastLR = useRef(0);

  // 検出→アクション
  const detectLR = (dir: -1 | 1) => {
    // 上下のブロック中は無視
    const now = performance.now();
    if (now - lastUD.current < UD_REFRACT_MS) return;

    if (dir > 0) skipToNext();     // RIGHT
    else skipToPrevious();         // LEFT
    lastLR.current = now;
  };

  const detectUD = (dir: -1 | 1) => {
    // 左右のブロック中は無視
    const now = performance.now();
    if (now - lastLR.current < LR_REFRACT_MS) return;

    if (dir > 0) togglePlayPause(); // UP
    else setShowPlaylistModal(true); // DOWN
    lastUD.current = now;
  };

  // メイン判定
  useEffect(() => {
    if (!sample) return;

    // 重力推定（LPF） … 表示に使いたければ lpfX/lpfY の出力を別途保持
    const gx = lpfX.current(sample.ax);
    const gy = lpfY.current(sample.ay);

    // HPFで動的成分を抽出
    const hx = hpfX.current(sample.ax);
    const hy = hpfY.current(sample.ay);

    // 上下は強調
    const hxScaled = hx * UD_SCALE;

    const absX = Math.abs(hxScaled);
    const absY = Math.abs(hy);

    // ---- まず上下を判定（縦優位条件）----
    // 条件: |hxScaled| >= UD_DOM * |hy|
    if (absX >= UD_DOM * absY) {
      // ヒステリシス
      if (hxScaled > TH_HI && udState.current !== "U") {
        udState.current = "U";
        detectUD(+1);
        return;
      }
      if (hxScaled < -TH_HI && udState.current !== "D") {
        udState.current = "D";
        detectUD(-1);
        return;
      }
      // 解除
      if (Math.abs(hxScaled) < TH_LO) {
        udState.current = null;
      }
      // 上下で決着した場合、左右は見ない
      return;
    }

    // ---- 次に左右を判定 ----
    if (hy > TH_HI && lrState.current !== "R") {
      lrState.current = "R";
      detectLR(+1); // RIGHT
      return;
    }
    if (hy < -TH_HI && lrState.current !== "L") {
      lrState.current = "L";
      detectLR(-1); // LEFT
      return;
    }
    if (Math.abs(hy) < TH_LO) {
      lrState.current = null;
    }
  }, [sample]); // sample 更新ごとに評価

  /* ========== 表示/UI（既存 onClick はそのまま） ========== */
  if (!accessToken || !deviceId) {
    return (
      <div className={styles.controlsContainer}>
        <p>Spotifyに接続してデバイスを設定してください...</p>
      </div>
    );
  }

  return (
    <div className={styles.controlsContainer}>
      {typeof status === "string" && (
        <div className={styles.bleStatus}>BLE: {status}</div>
      )}

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
          <div className={styles.noTrack}><p>再生中の曲がありません</p></div>
        )}
      </div>

      {/* 既存 onClick はそのまま残す */}
      <div className={styles.controls}>
        <button onClick={skipToPrevious} className={styles.controlButton}>⏮️</button>
        <button onClick={togglePlayPause} className={styles.playButton}>
          {isPlaying ? "⏸️" : "▶️"}
        </button>
        <button onClick={skipToNext} className={styles.controlButton}>⏭️</button>
      </div>

      <div className={styles.testControls}>
        <div className={styles.playlistSelector}>
          <button
            onClick={() => setShowPlaylistModal(true)}
            className={styles.testButton}
          >
            📁 プレイリストを選択
          </button>
          <button
            onClick={() => router.push("/music")}
            className={styles.testButton}
          >
            次の画面へ
          </button>
        </div>
      </div>

      {showPlaylistModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPlaylistModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>プレイリストを選択</h3>
              <button className={styles.closeButton} onClick={() => setShowPlaylistModal(false)}>✕</button>
            </div>

            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.playlistGrid}>
                {playlists.map((playlist, index) => (
                  <div
                    key={playlist.id}
                    className={`${styles.playlistCard}
                                ${selectedPlaylist === playlist.id ? styles.selected : ""}
                                ${highlightedIndex === index ? styles.highlighted : ""}`}
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
                <button onClick={navigatePrevious} className={styles.navButton}>前へ</button>
                <button onClick={selectHighlighted} className={styles.selectButton}>決定</button>
                <button onClick={navigateNext} className={styles.navButton}>次へ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicControls;
