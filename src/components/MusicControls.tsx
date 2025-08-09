"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpotifyStore } from "../store/spotify";
import styles from "./MusicControls.module.scss";

import IconDown from "@/assets/down.svg";
import IconLeft from "@/assets/left.svg";
import IconRight from "@/assets/right.svg";
import IconUp from "@/assets/up.svg";
import musicIcon from "@/assets/music.svg"; // 音楽アイコン
import music1Icon from "@/assets/music1.svg"; // 音楽アイコン1
import music2Icon from "@/assets/music2.svg"; // 音楽アイコン2
import music3Icon from "@/assets/music3.svg"; // 音楽アイコン3
import backIcon from "@/assets/back.svg"; // 戻るボタンのアイコン
import rightHuman from "@/assets/rightHuman.svg"; // 戻るボタンのアイコン
import leftHuman from "@/assets/leftHuman.svg"; // 戻るボタンのアイコン
import type { AccelSample } from "@/lib/xiaoBle";
import { usePathname, useRouter } from "next/navigation";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlay, setIsPlay] = useState(false);
  const [currentAudio, setCurrentAudio] = useState("/audio/a.mp3");
  const [showMusicIcon, setShowMusicIcon] = useState(false);
  const [currentMusicIcon, setCurrentMusicIcon] = useState(musicIcon);
  const [multipleIcons, setMultipleIcons] = useState<
    Array<{
      id: number;
      icon: string;
      x: number;
      y: number;
    }>
  >([]);
  const pathname = usePathname();

  const hideOn = ["/controls"];
  const controlsShow = hideOn.includes(pathname);

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
            body: JSON.stringify({
              context_uri: `spotify:playlist:${playlistId}`,
            }),
          }
        );
        if (r.status === 401)
          return alert("認証が切れました。再ログインしてください。");
        if (r.status === 403) return alert("この機能はプレミアム限定です。");
        if (r.status === 404)
          return alert(
            "アクティブなデバイスが見つかりません。Spotifyアプリで再生してください。"
          );
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
        return alert(
          "アクティブなデバイスが見つかりません。Spotifyアプリで再生してください。"
        );
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
      if (r.status === 401)
        return alert("認証が切れました。再ログインしてください。");
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
      if (r.status === 401)
        return alert("認証が切れました。再ログインしてください。");
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
    TH_HI: 0.45, // g
    TH_LO: 0.25, // g
    HPF_FC: 2.3, // Hz
    LPF_FC: 0.5, // Hz
    UD_SCALE: 2.2, // 上下の閾値強化
    UD_DOM: 1.8, // 縦優位: |fvert| >= UD_DOM * |fx|
    UD_REFRACT_MS: 600, // UD検出後のリフラクト
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
    let yPrev = 0,
      xPrev = 0;
    return (x: number) => {
      const y = alpha * (yPrev + x - xPrev);
      yPrev = y;
      xPrev = x;
      return y;
    };
  }
  function makeLPF(fc: number) {
    const RC = 1 / (2 * Math.PI * fc);
    const alpha = SAMPLE_DT / (RC + SAMPLE_DT);
    let y = 0;
    return (x: number) => {
      y = y + alpha * (x - y);
      return y;
    };
  }

  // HPF/LPF（X,Y,Z）＋ 縦成分用HPF
  const hpfXproc = useRef(makeHPF(CFG.HPF_FC));
  const hpfYproc = useRef(makeHPF(CFG.HPF_FC));
  const hpfZproc = useRef(makeHPF(CFG.HPF_FC));
  const lpfXproc = useRef(makeLPF(CFG.LPF_FC));
  const lpfYproc = useRef(makeLPF(CFG.LPF_FC));
  const lpfZproc = useRef(makeLPF(CFG.LPF_FC));
  const hpfVert = useRef(makeHPF(CFG.HPF_FC));

  // ====== 汎用検出器（script.js の makeDetector と同等） ======
  function makeDetector(
    onPos: () => void,
    onNeg: () => void,
    opts?: {
      TH_HI?: number;
      TH_LO?: number;
      REFRACT_MS?: number;
    }
  ) {
    const TH_HI = opts?.TH_HI ?? CFG.TH_HI;
    const TH_LO = opts?.TH_LO ?? CFG.TH_LO;
    const REFRACT_MS = opts?.REFRACT_MS ?? 350;
    const MIN_MS = 100,
      MAX_MS = 900;

    let state: "idle" | "tracking" = "idle";
    let startTs = 0,
      firstSign = 0,
      crossedZero = false;
    let lastDir: "POS" | "NEG" | null = null;
    let lastDirTs = 0;

    return (x: number) => {
      const now = performance.now();
      const ax = Math.abs(x);
      const sg = Math.sign(x) as -1 | 0 | 1;

      switch (state) {
        case "idle":
          if (ax > TH_HI && now - lastDirTs > REFRACT_MS) {
            state = "tracking";
            startTs = now;
            firstSign = sg !== 0 ? sg : x >= 0 ? 1 : -1;
            crossedZero = false;
          }
          break;

        case "tracking":
          if (sg !== 0 && sg !== firstSign) crossedZero = true;

          if (ax < TH_LO && now - startTs > MIN_MS) {
            const dur = now - startTs;
            if (dur < MAX_MS && crossedZero) {
              const dir: "POS" | "NEG" = firstSign > 0 ? "POS" : "NEG";
              if (dir !== lastDir || now - lastDirTs > REFRACT_MS) {
                if (dir === "POS") onPos();
                else onNeg();
                lastDir = dir;
                lastDirTs = now;
              }
            }
            state = "idle";
          }

          if (now - startTs > MAX_MS) state = "idle";
          break;
      }
    };
  }

  // 上下用（しきい値・リフラクト強化）
  function makeDetectorUD(onPos: () => void, onNeg: () => void) {
    return makeDetector(onPos, onNeg, {
      TH_HI: CFG.TH_HI * CFG.UD_SCALE,
      TH_LO: CFG.TH_LO * CFG.UD_SCALE * 0.9,
      REFRACT_MS: CFG.UD_REFRACT_MS,
    });
  }

  // ====== イベント/ブロックの状態 ======
  const nowMs = () => performance.now();
  const lastLRts = useRef(0);
  const lastUDts = useRef(0);
  const freezeUntilTs = useRef(0);

  // ★ 最小可視化：直近の判定と、発火しない理由をテキスト表示
  const [lastGesture, setLastGesture] = useState<string>("-");
  const lastReasonRef = useRef<string>("-");
  const [lastReason, setLastReason] = useState<string>("-");

  const onRight = () => {
    setLastGesture("Right");
    skipToNext();
    lastLRts.current = nowMs();
    // console.log("Right");
  };
  const onLeft = () => {
    setLastGesture("Left");
    skipToPrevious();
    lastLRts.current = nowMs();
    // console.log("Left");
  };
  const onUp = () => {
    setLastGesture("Up");
    togglePlayPause();
    lastUDts.current = nowMs();
    freezeUntilTs.current = lastUDts.current + CFG.POST_UD_FREEZE_MS; // 直後フリーズ
    // console.log("Up");
  };
  const onDown = () => {
    setLastGesture("Down");
    setShowPlaylistModal(true);
    lastUDts.current = nowMs();
    freezeUntilTs.current = lastUDts.current + CFG.POST_UD_FREEZE_MS;
    // console.log("Down");
  };

  const detectLR = useRef(makeDetector(onRight, onLeft));
  const detectUD = useRef(makeDetectorUD(onUp, onDown));

  // ====== 重力軸の決定（script.js 同等） ======
  const upDownAxis = useRef<"x" | "y" | "z">("z");
  const gravMaxAxis = useRef<"-" | "x" | "y" | "z">("-");
  const lastAxisChangeTs = useRef(0);

  function decideUpDownAxis(gx: number, gy: number, gz: number) {
    const aX = Math.abs(gx),
      aY = Math.abs(gy),
      aZ = Math.abs(gz);
    let maxA = aX,
      maxAxis: "x" | "y" | "z" = "x";
    if (aY > maxA) {
      maxA = aY;
      maxAxis = "y";
    }
    if (aZ > maxA) {
      maxA = aZ;
      maxAxis = "z";
    }
    if (maxA >= 0.6) {
      const prev = upDownAxis.current;
      if (maxAxis === "z") upDownAxis.current = "y";
      else if (maxAxis === "y") upDownAxis.current = "z";
      gravMaxAxis.current = maxAxis;
      if (upDownAxis.current !== prev)
        lastAxisChangeTs.current = performance.now();
    }
  }

  const playMP3 = (audioFile: string) => {
    if (audioRef.current) {
      if (audioFile) {
        audioRef.current.src = audioFile;
        setCurrentAudio(audioFile);

        // ちょっと待ってから再生（ファイル変更のため）
        setTimeout(() => {
          console.log("Playing audio:", audioFile);
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlay(true);
          }
        }, 100);
      } else {
        if (isPlay) {
          audioRef.current.pause();
          setIsPlay(false);
        } else {
          audioRef.current.play();
          setIsPlay(true);
        }
      }
    }
  };

  const showRandomIcons = () => {
    // 4つのアイコンをランダムな位置に配置
    const icons = [musicIcon, music1Icon, music2Icon, music3Icon];
    const newIcons = icons.map((icon, index) => ({
      id: index,
      icon: icon,
      x: Math.random() * 70 + 10, // 10%から80%の範囲でランダム
      y: Math.random() * 70 + 10, // 10%から80%の範囲でランダム
    }));

    setMultipleIcons(newIcons);

    setTimeout(() => {
      setMultipleIcons([]);
    }, 1500);
  };

  // ====== メイン判定 ======
  useEffect(() => {
    if (!sample) return;

    // 入力
    const ax = sample.ax,
      ay = sample.ay,
      az = sample.az;

    // LPF（重力推定）
    const gx = lpfXproc.current(ax);
    const gy = lpfYproc.current(ay);
    const gz = lpfZproc.current(az);
    decideUpDownAxis(gx, gy, gz);

    // HPF（動き成分）
    const fx = hpfXproc.current(ax);
    const fy = hpfYproc.current(ay);
    const fz = hpfZproc.current(az);

    // 上下：重力方向（a·ĝ）をHPF
    const gmag = Math.hypot(gx, gy, gz);
    let fvert = 0;
    if (gmag > 0.2) {
      const nx = gx / gmag,
        ny = gy / gmag,
        nz = gz / gmag;
      const avert = ax * nx + ay * ny + az * nz;
      fvert = hpfVert.current(avert);
    }

    const now = nowMs();

    // UD直後フリーズ
    if (now < freezeUntilTs.current) {
      detectLR.current(0);
      detectUD.current(0);
      const reason = `freeze (${Math.round(freezeUntilTs.current - now)}ms)`;
      if (lastReasonRef.current !== reason) {
        lastReasonRef.current = reason;
        setLastReason(reason);
      }
      return;
    }

    // 左右（UD直後のブロック）
    const udToLRBlocked = now - lastUDts.current < CFG.UD_TO_LR_BLOCK_MS;
    if (!udToLRBlocked) {
      detectLR.current(fx); // ※ script.js 準拠：左右= X軸HPF
    } else {
      detectLR.current(0);
    }

    // 上下（優位条件など）
    const dominanceOK = Math.abs(fvert) > CFG.UD_DOM * Math.abs(fx);
    const axisOK = now - lastAxisChangeTs.current > CFG.AXIS_COOLDOWN_MS;
    const mutualOK = now - lastLRts.current > CFG.MUTUAL_BLOCK_MS;
    const amplitudeOK = Math.abs(fvert) > CFG.TH_LO * CFG.UD_SCALE * 0.8;

    if (axisOK && mutualOK && dominanceOK && amplitudeOK) {
      detectUD.current(fvert);
      if (lastReasonRef.current !== "-") {
        lastReasonRef.current = "-";
        setLastReason("-");
      }
    } else {
      detectUD.current(0);
      // いま発火しない主因を簡潔に表示
      const reason = !axisOK
        ? "axis-cooldown"
        : !mutualOK
        ? "mutual-block(LR→UD)"
        : udToLRBlocked
        ? "block(UD→LR)"
        : !dominanceOK
        ? "dominance NG (|fvert|≦k|fx|)"
        : !amplitudeOK
        ? "amplitude NG"
        : "-";
      if (lastReasonRef.current !== reason) {
        lastReasonRef.current = reason;
        setLastReason(reason);
      }
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

  const handleButtonClick = (audioFile: string) => () => {
    // ボタンクリック時の処理
    playMP3(audioFile);
    showRandomIcons();
  };

  return (
    <div className={styles.controlsContainer}>
      {/* 音楽アイコンのオーバーレイ */}
      {showMusicIcon && (
        <div className={styles.musicIconOverlay}>
          <Image
            src={currentMusicIcon}
            alt="Music Playing"
            width={120}
            height={120}
            className={styles.musicIcon}
          />
        </div>
      )}

      {/* 複数のランダムアイコンのオーバーレイ */}
      {multipleIcons.map((iconData) => (
        <div
          key={iconData.id}
          className={styles.musicIconOverlay}
          style={{
            left: `${iconData.x}%`,
            top: `${iconData.y}%`,
            position: "fixed",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Image
            src={iconData.icon}
            alt="Music Icon"
            width={120}
            height={120}
            className={styles.musicIcon}
          />
        </div>
      ))}

      {/* ★ 最小可視化（右上に表示） */}
      <div
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 14,
          zIndex: 1000,
        }}
      >
        <div>
          <b>Last Gesture:</b> {lastGesture}
        </div>
        <div style={{ opacity: 0.9 }}>
          <b>Reason:</b> {lastReason}
        </div>
        {typeof status === "string" && (
          <div style={{ opacity: 0.7 }}>BLE: {status}</div>
        )}
      </div>

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

      {/* 既存 onClick はそのまま残す */}
      {controlsShow ? (
        <>
          <div className={styles.controls}>
            <button onClick={skipToPrevious} className={styles.navButton}>
              <Image src={IconLeft} alt="Previous" width={60} height={60} />
              <br />
              Back
            </button>
            <button onClick={togglePlayPause} className={styles.selectButton}>
              <span>
                {isPlaying ? (
                  <>
                    <Image src={IconDown} alt="Pause" width={80} height={80} />
                    <br />
                    Pause
                  </>
                ) : (
                  <>
                    <Image src={IconUp} alt="Play" width={80} height={80} />
                    <br />
                    Play
                  </>
                )}
              </span>
            </button>
            <button onClick={skipToNext} className={styles.navButton}>
              <Image src={IconRight} alt="Next" width={60} height={60} />
              <br />
              Next
            </button>
          </div>

          <div className={styles.testControls}>
            <div className={styles.playlistSelector}>
              <button
                onClick={() => setShowPlaylistModal(true)}
                className={styles.testButton}
              >
                うでを下に振ってプレイリスト選択に戻る
              </button>
              <button
                onClick={() => router.push("/music")}
                className={styles.testButton}
              >
                次の画面へ
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.controls}>
            <button
              className={styles.testButton}
              onClick={handleButtonClick("/audio/a.mp3")}
            >
              音声A
            </button>
            <button
              className={styles.testButton}
              onClick={handleButtonClick("/audio/e.mp3")}
            >
              音声E
            </button>
            <button
              className={styles.testButton}
              onClick={handleButtonClick("/audio/i.mp3")}
            >
              音声I
            </button>
            <button
              className={styles.testButton}
              onClick={handleButtonClick("/audio/u.mp3")}
            >
              音声U
            </button>

            {/* MP3再生用のaudio要素 */}
            <audio
              ref={audioRef}
              onEnded={() => setIsPlay(false)}
              onPause={() => setIsPlay(false)}
              onPlay={() => setIsPlay(true)}
              src={currentAudio}
            >
              お使いのブラウザはHTML5 audioに対応していません。
            </audio>
          </div>
          <div className={styles.backButtonContainer}>
            <Image
              src={rightHuman}
              alt="Select Playlist"
              width={100}
              height={100}
              className={styles.backButton}
            />
            <Image
              src={backIcon}
              alt="Select Playlist"
              width={100}
              height={100}
              className={styles.backButton}
              onClick={() => router.push("/controls")}
            />
            <Image
              src={leftHuman}
              alt="Select Playlist"
              width={100}
              height={100}
              className={styles.backButton}
            />
          </div>
        </>
      )}

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
                {playlists.map((playlist, index) => (
                  <div
                    key={playlist.id}
                    className={`${styles.playlistCard}
                                ${
                                  selectedPlaylist === playlist.id
                                    ? styles.selected
                                    : ""
                                }
                                ${
                                  highlightedIndex === index
                                    ? styles.highlighted
                                    : ""
                                }`}
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
                  <Image src={IconLeft} alt="Previous" width={60} height={60} />
                  <br />
                  左へ
                </button>
                <button
                  onClick={selectHighlighted}
                  className={styles.selectButton}
                >
                  <Image src={IconUp} alt="Play" width={80} height={80} />
                  <br />
                  決定
                </button>
                <button onClick={navigateNext} className={styles.navButton}>
                  <Image src={IconRight} alt="Next" width={60} height={60} />
                  <br />
                  右へ
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
