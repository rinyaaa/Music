"use client";

import SpotifyAuth from "../components/SpotifyAuth";
import SpotifyPlayer from "../components/SpotifyPlayer";
import MusicControls from "../components/MusicControls";
import { useSpotifyStore } from "../store/spotify";
import styles from "./page.module.scss";

export default function Home() {
  const { accessToken } = useSpotifyStore();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>🎵 Gesture Music Controller</h1>
        <p>ジェスチャーで音楽を操作しよう！</p>
      </header>

      <main className={styles.main}>
        <SpotifyAuth />

        {accessToken && (
          <>
            <SpotifyPlayer />
            <MusicControls />
          </>
        )}

        {!accessToken && (
          <div className={styles.instructions}>
            <h2>ログインしてください</h2>
            <p>Spotifyアカウントでログインすると音楽制御ができます</p>
          </div>
        )}
      </main>
    </div>
  );
}
