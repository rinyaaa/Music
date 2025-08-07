"use client";

import SpotifyPlayer from "../../components/SpotifyPlayer";
import MusicControls from "../../components/MusicControls";
import { useSpotifyStore } from "../../store/spotify";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "../page.module.scss";

export default function ControlsPage() {
  const { accessToken } = useSpotifyStore();
  const router = useRouter();

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
        <h1>🎵 Music Controls</h1>
        <p>ジェスチャーで音楽を操作しよう！</p>
      </header>

      <main className={styles.main}>
        <SpotifyPlayer />
        <MusicControls />
      </main>
    </div>
  );
}
