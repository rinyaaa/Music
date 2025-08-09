"use client";

import SpotifyAuth from "../components/SpotifyAuth";
import { useSpotifyStore } from "../store/spotify";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./page.module.scss";
import Image from "next/image"; // 画像を表示するためのインポート
import icon from "@/assets/logo.png"; // ロゴ画像のパスを指定

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
            width={150}
            height={150}
          />
          <p>ジェスチャーで音楽を操作しよう！</p>
        </header>

        <main className={styles.loginBox}>
          <p>音楽をジェスチャーで操作するために</p>
          <p>Spotifyにログインしてください</p>
          <SpotifyAuth />
        </main>
      </div>
    </div>
  );
}
