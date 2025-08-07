"use client";

import SpotifyAuth from "../components/SpotifyAuth";
import { useSpotifyStore } from "../store/spotify";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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
      <header className={styles.header}>
        <h1>🎵 Gesture Music Controller</h1>
        <p>ジェスチャーで音楽を操作しよう！</p>
      </header>

      <main className={styles.main}>
        <SpotifyAuth />
      </main>
    </div>
  );
}
