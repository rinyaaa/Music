"use client";

import icon from "@/assets/logo.svg";
import { AccelSample, connectXiaoBle, XiaoBleController } from "@/lib/xiaoBle";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MusicControls from "../../components/MusicControls";
import { useSpotifyStore } from "../../store/spotify";
import styles from "../page.module.scss";

export default function ControlsPage() {
  const { accessToken } = useSpotifyStore();
  const router = useRouter();

  const [status, setStatus] = useState("未接続");
  const [sample, setSample] = useState<AccelSample | null>(null);
  const ctrlRef = useRef<XiaoBleController | null>(null);

  const handleConnect = async () => {
    try {
      ctrlRef.current?.disconnect();
      const ctrl = await connectXiaoBle({
        onStatus: setStatus,
        onDisconnect: () => setStatus("切断されました。"),
        onData: (s) => setSample(s),
      });
      ctrlRef.current = ctrl;
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setStatus(`接続に失敗: ${errorMessage}`);
    }
  };

  const handleDisconnect = () => {
    ctrlRef.current?.disconnect();
    ctrlRef.current = null;
    setStatus("手動で切断しました。");
  };

  // 認証チェック
  useEffect(() => {
    if (!accessToken) router.push("/");
  }, [accessToken, router]);

  // アンマウント時に切断
  useEffect(() => {
    return () => {
      ctrlRef.current?.disconnect();
      ctrlRef.current = null;
    };
  }, []);

  if (!accessToken) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <p>認証が必要です。ホームページにリダイレクト中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Image
          src={icon}
          alt="Gesture Audio ロゴ"
          className={styles.logo}
          width={200}
          height={200}
        />

        {/* （任意）ここに接続テスターを残すならこのまま */}
        <div style={{ padding: 16 }}>
          {/* <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src={icon} alt="logo" width={36} height={36} />
            <h1 style={{ margin: 0, fontSize: "1.1rem" }}>センサーと接続！</h1>
          </div> */}
          <div className={styles.connectionButtons}>
            <button onClick={handleConnect} className={styles.navButton}>
              センサーと接続
            </button>
            <button onClick={handleDisconnect} className={styles.navButton}>
              センサーと切断
            </button>
          </div>

          {/* <div style={{ marginTop: 8 }}>状態: {status}</div>
          <div style={{ marginTop: 8, whiteSpace: "pre" }}>
            {sample
              ? `ax: ${sample.ax.toFixed(3)} g, ay: ${sample.ay.toFixed(
                  3
                )} g, az: ${sample.az.toFixed(3)} g`
              : "データ未受信"}
          </div> */}
        </div>
      </header>

      <main className={styles.main}>
        {/* ★ ここで props を渡す */}
        <MusicControls sample={sample} status={status} />
      </main>
    </div>
  );
}
