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
            <h2>使い方</h2>
            <ol>
              <li>まず、Spotifyでログインしてください</li>
              <li>音楽を再生してコントロールをテストします</li>
              <li>カメラを使ったジェスチャー機能を有効にします</li>
              <li>手の動きで音楽を操作できるようになります！</li>
            </ol>

            <div className={styles.features}>
              <h3>予定機能</h3>
              <ul>
                <li>✋ 手をかざして一時停止</li>
                <li>👈 左スワイプで前の曲</li>
                <li>👉 右スワイプで次の曲</li>
                <li>💃 踊りだしたらPOP音楽</li>
                <li>🧘 静かなときはlo-fi</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
