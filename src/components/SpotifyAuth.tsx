import { useEffect } from "react";
import { useSpotifyStore } from "../store/spotify";
import { generateRandomString, sha256, base64encode } from "../utils/pkce";
import styles from "./SpotifyAuth.module.scss";

const SpotifyAuth = () => {
  const { accessToken, setAccessToken } = useSpotifyStore();

  useEffect(() => {
    // ページ読み込み時にlocalStorageからトークンを復元
    const savedToken = localStorage.getItem("spotify_access_token");
    if (savedToken && !accessToken) {
      setAccessToken(savedToken);
    }
  }, [setAccessToken, accessToken]);

  const handleLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const redirectUri = "http://127.0.0.1:3000/callback";

    // PKCE用のコードチャレンジを生成
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    // localStorageにcode_verifierを保存（callback時に使用）
    localStorage.setItem("code_verifier", codeVerifier);

    const scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "playlist-read-private",
      "playlist-read-collaborative",
    ];

    const params = new URLSearchParams({
      client_id: clientId!,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      show_dialog: "true",
    });

    const spotifyUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    window.location.href = spotifyUrl;
  };

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem("spotify_access_token");
  };

  if (accessToken) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.status}>
          <span className={styles.statusIndicator}></span>
          Spotify に接続済み
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <h2>Spotify ジェスチャーコントローラー</h2>
      <p>音楽をジェスチャーで操作するために、Spotifyにログインしてください</p>
      <button onClick={handleLogin} className={styles.loginButton}>
        Spotify でログイン
      </button>
    </div>
  );
};

export default SpotifyAuth;
