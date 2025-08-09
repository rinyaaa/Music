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
      {accessToken ? (
        //【A】accessTokenが存在する場合：プレイヤー画面
        <div className={styles.container}>
          <header className={styles.header}>
            <img src="/logo.png"
            alt="Gesture Audio　ロゴ"
            className={styles.logo}
            />
            <p>ジェスチャーで音楽を操作しよう！</p>
          </header>

          <main>
            <SpotifyPlayer />
            <MusicControls />
          </main>
        </div>
      ) : (
        //【B】accessTokenが存在しない場合：ログイン画面
        <div className={styles.container}>
          <header className={styles.header}>
            <img src="/logo.png"
            alt="Gesture Audio　ロゴ"
            className={styles.logo}
            />
            <p>ジェスチャーで音楽を操作しよう！</p>
          </header>

          <main className={styles.loginBox}>
            <p>音楽をジェスチャーで操作するために</p>
            <p>Spotifyにログインしてください</p>
            <SpotifyAuth />
          </main>
        </div>
      )}
    </div>
  );
}
