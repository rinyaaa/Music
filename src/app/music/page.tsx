"use client";

import MusicControls from "../../components/MusicControls";
import icon from "@/assets/logo.png"; // ロゴ画像のパスを指定
import Image from "next/image";
import styles from "./index.module.scss"; // スタイルをインポート
import { useRef, useState } from "react";

export default function MusicPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState("/audio/a.mp3");

  const playMP3 = (audioFile: string) => {
    if (audioRef.current) {
      if (audioFile) {
        audioRef.current.src = audioFile;
        setCurrentAudio(audioFile);

        // ちょっと待ってから再生（ファイル変更のため）
        setTimeout(() => {
          console.log("Playing audio:", audioFile);
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      } else {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  return (
    <>
      <div className={styles.page}>
        <Image
          src={icon}
          alt="Gesture Audio ロゴ"
          className={styles.logo}
          width={250}
          height={250}
        />
        {/* <MusicControls /> */}

        <button
          className={styles.testButton}
          onClick={() => playMP3("/audio/a.mp3")}
        >
          音声A
        </button>
        <button
          className={styles.testButton}
          onClick={() => playMP3("/audio/e.mp3")}
        >
          音声E
        </button>
        <button
          className={styles.testButton}
          onClick={() => playMP3("/audio/i.mp3")}
        >
          音声I
        </button>
        <button
          className={styles.testButton}
          onClick={() => playMP3("/audio/u.mp3")}
        >
          音声U
        </button>

        {/* MP3再生用のaudio要素 */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          src={currentAudio}
        >
          お使いのブラウザはHTML5 audioに対応していません。
        </audio>
      </div>
    </>
  );
}
