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

// ====== 固定パラメータ（script.js と同値） ======
const CFG = {
  TH_HI: 0.45,          // g
  TH_LO: 0.25,          // g
  HPF_FC: 2.3,          // Hz
  LPF_FC: 0.5,          // Hz
  UD_SCALE: 2.2,        // 上下の閾値強化
  UD_DOM: 1.8,          // 縦優位: |fvert| >= UD_DOM * |fx|
  UD_REFRACT_MS: 600,   // UD検出後のリフラクト
  AXIS_COOLDOWN_MS: 500,
  MUTUAL_BLOCK_MS: 350,
  UD_TO_LR_BLOCK_MS: 300,
  POST_UD_FREEZE_MS: 350,
};

const SAMPLE_DT = 0.02; // 50Hz想定（元JSと同じ）

// ====== フィルタ（script.js と同式） ======
function makeHPF(fc: number) {
  const RC = 1 / (2 * Math.PI * fc);
  const alpha = RC / (RC + SAMPLE_DT);
  let yPrev = 0, xPrev = 0;
  return (x: number) => {
    const y = alpha * (yPrev + x - xPrev);
    yPrev = y; xPrev = x;
    return y;
  };
}
function makeLPF(fc: number) {
  const RC = 1 / (2 * Math.PI * fc);
  const alpha = SAMPLE_DT / (RC + SAMPLE_DT);
  let y = 0;
  return (x: number) => { y = y + alpha * (x - y); return y; };
}

// HPF/LPF（X,Y,Z）＋ 縦成分用HPF
const hpfXproc = useRef(makeHPF(CFG.HPF_FC));
const hpfYproc = useRef(makeHPF(CFG.HPF_FC));
const hpfZproc = useRef(makeHPF(CFG.HPF_FC));
const lpfXproc = useRef(makeLPF(CFG.LPF_FC));
const lpfYproc = useRef(makeLPF(CFG.LPF_FC));
const lpfZproc = useRef(makeLPF(CFG.LPF_FC));
const hpfVert  = useRef(makeHPF(CFG.HPF_FC));

// ====== 汎用検出器（script.js の makeDetector と同等） ======
function makeDetector(onPos: () => void, onNeg: () => void, opts?: {
  TH_HI?: number; TH_LO?: number; REFRACT_MS?: number;
}) {
  const TH_HI = opts?.TH_HI ?? CFG.TH_HI;
  const TH_LO = opts?.TH_LO ?? CFG.TH_LO;
  const REFRACT_MS = opts?.REFRACT_MS ?? 350;
  const MIN_MS = 100, MAX_MS = 900;

  let state: "idle" | "tracking" = "idle";
  let startTs = 0, firstSign = 0, crossedZero = false;
  let lastDir: "POS" | "NEG" | null = null;
  let lastDirTs = 0;

  return (x: number) => {
    const now = performance.now();
    const ax = Math.abs(x);
    const sg = Math.sign(x) as -1 | 0 | 1;

    switch (state) {
      case "idle":
        if (ax > TH_HI && (now - lastDirTs) > REFRACT_MS) {
          state = "tracking";
          startTs = now;
          firstSign = (sg !== 0) ? sg : (x >= 0 ? 1 : -1);
          crossedZero = false;
        }
        break;

      case "tracking":
        if ((sg !== 0) && (sg !== firstSign)) crossedZero = true;

        if (ax < TH_LO && (now - startTs) > MIN_MS) {
          const dur = now - startTs;
          if (dur < MAX_MS && crossedZero) {
            const dir: "POS" | "NEG" = (firstSign > 0) ? "POS" : "NEG";
            if (dir !== lastDir || (now - lastDirTs) > REFRACT_MS) {
              if (dir === "POS") onPos(); else onNeg();
              lastDir = dir; lastDirTs = now;
            }
          }
          state = "idle";
        }

        if ((now - startTs) > MAX_MS) state = "idle";
        break;
    }
  };
}

// 上下用は閾値とリフラクトを強める（script.js の makeDetectorUD）
function makeDetectorUD(onPos: () => void, onNeg: () => void) {
  return makeDetector(onPos, onNeg, {
    TH_HI: CFG.TH_HI * CFG.UD_SCALE,
    TH_LO: CFG.TH_LO * CFG.UD_SCALE * 0.9,
    REFRACT_MS: CFG.UD_REFRACT_MS,
  });
}

// ====== イベント/ブロックの状態（script.js 同等） ======
const nowMs = () => performance.now();
const lastLRts = useRef(0);
const lastUDts = useRef(0);
const freezeUntilTs = useRef(0);

const onRight = () => { /* 右＝次 */ skipToNext(); lastLRts.current = nowMs(); };
const onLeft  = () => { /* 左＝前 */ skipToPrevious(); lastLRts.current = nowMs(); };
const onUp    = () => {
  /* 上＝再生/停止 */
  togglePlayPause();
  lastUDts.current = nowMs();
  freezeUntilTs.current = lastUDts.current + CFG.POST_UD_FREEZE_MS; // 直後は全無効
};
const onDown  = () => {
  /* 下＝プレイリスト表示 */
  setShowPlaylistModal(true);
  lastUDts.current = nowMs();
  freezeUntilTs.current = lastUDts.current + CFG.POST_UD_FREEZE_MS;
};

const detectLR = useRef(makeDetector(onRight, onLeft));
const detectUD = useRef(makeDetectorUD(onUp, onDown));

// ====== 重力軸の決定（script.js decideUpDownAxis 同等） ======
let upDownAxis = useRef<"x"|"y"|"z">("z");
let gravMaxAxis = useRef<"-"|"x"|"y"|"z">("-");
const lastAxisChangeTs = useRef(0);

function decideUpDownAxis(gx: number, gy: number, gz: number) {
  const aX = Math.abs(gx), aY = Math.abs(gy), aZ = Math.abs(gz);
  let maxA = aX, maxAxis: "x"|"y"|"z" = "x";
  if (aY > maxA) { maxA = aY; maxAxis = "y"; }
  if (aZ > maxA) { maxA = aZ; maxAxis = "z"; }
  if (maxA >= 0.6) {
    const prev = upDownAxis.current;
    // 元JSそのまま：z が最大なら y をUD軸、y が最大なら z をUD軸
    if (maxAxis === "z") upDownAxis.current = "y";
    else if (maxAxis === "y") upDownAxis.current = "z";
    gravMaxAxis.current = maxAxis;
    if (upDownAxis.current !== prev) lastAxisChangeTs.current = performance.now();
  }
}

// ====== メイン判定（script.js の characteristicvaluechanged 相当） ======
useEffect(() => {
  if (!sample) return;

  // 受信値
  const ax = sample.ax, ay = sample.ay, az = sample.az;

  // 重力推定（LPF）
  const gx = lpfXproc.current(ax);
  const gy = lpfYproc.current(ay);
  const gz = lpfZproc.current(az);
  decideUpDownAxis(gx, gy, gz);

  // 動き成分（HPF）
  const fx = hpfXproc.current(ax);
  const fy = hpfYproc.current(ay);
  const fz = hpfZproc.current(az);

  // 上下：重力方向（a·ĝ）をHPF
  const gmag = Math.hypot(gx, gy, gz);
  let fvert = 0;
  if (gmag > 0.2) {
    const nx = gx / gmag, ny = gy / gmag, nz = gz / gmag;
    const avert = ax * nx + ay * ny + az * nz; // a·ĝ
    fvert = hpfVert.current(avert);
  }

  const now = nowMs();

  // ★ UD直後のハードフリーズ（全入力無効）
  if (now < freezeUntilTs.current) {
    detectLR.current(0); detectUD.current(0);
    return;
  }

  // ====== 左右（UD直後は必ずブロック） ======
  const udToLRBlocked = (now - lastUDts.current) < CFG.UD_TO_LR_BLOCK_MS;
  if (!udToLRBlocked) {
    // ★ 元JSは X 軸 HPF（fx）を左右の入力に使用
    detectLR.current(fx);
  } else {
    detectLR.current(0);
  }

  // ====== 上下（相互ブロック／軸クール／優位比／振幅） ======
  const dominanceOK = Math.abs(fvert) > (CFG.UD_DOM * Math.abs(fx));
  const axisOK   = (now - lastAxisChangeTs.current) > CFG.AXIS_COOLDOWN_MS;
  const mutualOK = (now - lastLRts.current) > CFG.MUTUAL_BLOCK_MS;
  const amplitudeOK = Math.abs(fvert) > (CFG.TH_LO * CFG.UD_SCALE * 0.8);

  if (axisOK && mutualOK && dominanceOK && amplitudeOK) {
    detectUD.current(fvert); // 発火時に freezeUntilTs を更新（onUp/onDown側で）
  } else {
    detectUD.current(0);
  }
}, [sample]);


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
