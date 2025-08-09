"use client";

import MusicControls from "../../components/MusicControls";
import icon from "@/assets/logo.svg"; // ロゴ画像のパスを指定
import Image from "next/image";
import styles from "./index.module.scss"; // スタイルをインポート

export default function MusicPage() {
  const sample = null; // ここは実際のサンプルデータに置き換えてください
  const status = "接続中"; // ここは実際のステータス

  return (
    <>
      <div className={styles.page}>
        <div className={styles.logoContainer}>
          <Image
            src={icon}
            alt="Gesture Audio ロゴ"
            className={styles.logo}
            width={250}
            height={250}
          />
        </div>
        <MusicControls sample={sample} status={status} />
      </div>
    </>
  );
}
