"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSpotifyStore } from "../../store/spotify";

export default function CallbackPage() {
  const router = useRouter();
  const { setAccessToken } = useSpotifyStore();
  const hasProcessed = useRef(false);

  const exchangeCodeForToken = useCallback(
    async (code: string, codeVerifier: string) => {
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "http://127.0.0.1:3000/callback",
            client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
            code_verifier: codeVerifier,
          }),
        });

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(
          "Token received:",
          data.access_token?.substring(0, 20) + "..."
        );

        if (data.access_token) {
          setAccessToken(data.access_token);
          localStorage.setItem("spotify_access_token", data.access_token);
          if (data.refresh_token) {
            localStorage.setItem("spotify_refresh_token", data.refresh_token);
          }
          localStorage.removeItem("code_verifier");
          router.push("/controls");
        } else {
          console.error("No access token received");
          router.push("/");
        }
      } catch (error) {
        console.error("Token exchange error:", error);
        router.push("/");
      }
    },
    [router, setAccessToken]
  );

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }

    hasProcessed.current = true;

    console.log("Callback page loaded");
    console.log("Full URL:", window.location.href);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      router.push("/");
      return;
    }

    if (code) {
      console.log(
        "Authorization code received:",
        code.substring(0, 20) + "..."
      );

      const codeVerifier = localStorage.getItem("code_verifier");
      if (!codeVerifier) {
        console.error("Code verifier not found");
        router.push("/");
        return;
      }

      exchangeCodeForToken(code, codeVerifier);
    } else {
      console.log("No authorization code found");
      router.push("/");
    }
  }, [router, exchangeCodeForToken]);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#191414",
        color: "white",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2>認証中...</h2>
        <p>Spotifyから戻ってきています。しばらくお待ちください。</p>
      </div>
    </div>
  );
}
