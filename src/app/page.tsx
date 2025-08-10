"use client";

import icon from "@/assets/logo.png"; // ロゴ画像のパスを指定
import {
  default as leftHuman,
  default as rightHuman,
} from "@/assets/rightHuman.svg"; // おじのアイコン
import Image from "next/image"; // 画像を表示するためのインポート
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import SpotifyAuth from "../components/SpotifyAuth";
import { useSpotifyStore } from "../store/spotify";
import styles from "./page.module.scss";

export default function Home() {
  const { accessToken } = useSpotifyStore();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (accessToken && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/controls");
    }
  }, [accessToken, router]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Image
            src={icon}
            alt="Gesture Audio　ロゴ"
            className={styles.logo}
            width={400}
            height={400}
          />
          <p>ジェスチャーで音楽を操作しよう！</p>
        </header>

        <main className={styles.loginBox}>
          <div className={styles.testControls}>
            <p>音楽をジェスチャーで操作するために</p>
            <p>Spotifyにログインしてください</p>
            <SpotifyAuth />
            <Image
              src={leftHuman}
              alt="Select Playlist"
              width={120}
              height={120}
            />
            <Image
              src={rightHuman}
              alt="Select Playlist"
              width={120}
              height={120}
              className={styles.backButton}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
