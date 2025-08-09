import { useEffect } from "react";
import { useSpotifyStore } from "../store/spotify";
import { generateRandomString, sha256, base64encode } from "../utils/pkce";
import styles from "./SpotifyAuth.module.scss";

const SpotifyAuth = () => {
  const { accessToken, setAccessToken } = useSpotifyStore();

  useEffect(() => {
    const savedToken = localStorage.getItem("spotify_access_token");
    if (savedToken && !accessToken) {
      setAccessToken(savedToken);
    }
  }, [setAccessToken, accessToken]);

  const handleLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;


    const redirectUri = "http://127.0.0.1:3000/callback";

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

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
      "user-library-read",
      "user-library-modify",
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

  // const handleLogout = () => {
  //   setAccessToken(null);
  //   localStorage.removeItem("spotify_access_token");
  // };

  return (

    <div className={styles.authContainer}>

      <button onClick={handleLogin} className={styles.loginButton}>
        Spotify でログイン
      </button>
  );
};

export default SpotifyAuth;
