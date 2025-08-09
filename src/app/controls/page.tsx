"use client";

import MusicControls from "../../components/MusicControls";
import { useSpotifyStore } from "../../store/spotify";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "../page.module.scss";
import Image from "next/image"; // 画像を表示するためのインポート
import icon from "@/assets/logo.png"; // ロゴ画像のパスを指定
import { useState, useRef } from "react";
import { connectXiaoBle, XiaoBleController, AccelSample } from "@/lib/xiaoBle";

export default function ControlsPage() {
  const { accessToken } = useSpotifyStore();
  const router = useRouter();
  const [status, setStatus] = useState("未接続");
  const [sample, setSample] = useState<AccelSample | null>(null);
  const ctrlRef = useRef<XiaoBleController | null>(null);

  const handleConnect = async () => {
    try {
      // 既存接続があれば一旦切断
      ctrlRef.current?.disconnect();

      const ctrl = await connectXiaoBle({
        onStatus: setStatus,
        onDisconnect: () => setStatus("切断されました。"),
        onData: (s) => setSample(s),
      });

      ctrlRef.current = ctrl;
    } catch (e: any) {
      console.error(e);
      setStatus(`接続に失敗: ${String(e?.message ?? e)}`);
    }
  };

  const handleDisconnect = () => {
    ctrlRef.current?.disconnect();
    ctrlRef.current = null;
    setStatus("手動で切断しました。");
  };

  useEffect(() => {
    if (!accessToken) {
      router.push("/");
    }
  }, [accessToken, router]);

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
          alt="Gesture Audio　ロゴ"
          className={styles.logo}
          width={250}
          height={250}
        />
        <p>ジェスチャーで音楽を操作しよう！</p>
        <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Image src={icon} alt="logo" width={36} height={36} />
        <h1 style={{ margin: 0, fontSize: "1.1rem" }}>XIAO BLE 接続テスト</h1>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={handleConnect}>接続</button>
        <button onClick={handleDisconnect}>切断</button>
      </div>

      <div style={{ marginTop: 8 }}>状態: {status}</div>

      <div style={{ marginTop: 8, whiteSpace: "pre" }}>
        {sample
          ? `ax: ${sample.ax.toFixed(3)} g, ay: ${sample.ay.toFixed(3)} g, az: ${sample.az.toFixed(3)} g`
          : "データ未受信"}
      </div>
    </div>
      </header>

      <main className={styles.main}>
        <MusicControls />
      </main>
    </div>
  );
}
