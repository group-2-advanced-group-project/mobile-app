// services/OAuthService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { awsConfig } from "../config/aws-config";

WebBrowser.maybeCompleteAuthSession();

class OAuthService {
  private discovery = {
    authorizationEndpoint: `https://${awsConfig.oauth.domain}/oauth2/authorize`,
    tokenEndpoint: `https://${awsConfig.oauth.domain}/oauth2/token`,
    revocationEndpoint: `https://${awsConfig.oauth.domain}/oauth2/revoke`,
  };

  async signInWithGoogle() {
    try {
      // 1. Create redirect URI
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "myapp",
        preferLocalhost: true, // For Expo Go testing
      });

      console.log("Redirect URI:", redirectUri);

      // 2. Create authorization request
      const request = new AuthSession.AuthRequest({
        clientId: awsConfig.userPoolWebClientId,
        scopes: awsConfig.oauth.scope,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          identity_provider: "Google",
        },
      });

      // 3. Open browser and wait for response
      const result = await request.promptAsync(this.discovery);

      console.log("Auth result:", result.type);

      if (result.type === "success") {
        const { code } = result.params;

        // 4. Exchange code for tokens
        const tokens = await this.exchangeCodeForTokens(
          code,
          redirectUri,
          request.codeVerifier!,
        );

        // 5. Store tokens
        await AsyncStorage.setItem("accessToken", tokens.access_token);
        await AsyncStorage.setItem("idToken", tokens.id_token);
        if (tokens.refresh_token) {
          await AsyncStorage.setItem("refreshToken", tokens.refresh_token);
        }

        return tokens;
      }

      throw new Error("Authentication was cancelled or failed");
    } catch (error) {
      console.error("OAuth error:", error);
      throw error;
    }
  }

  private async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: awsConfig.userPoolWebClientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(
      `https://${awsConfig.oauth.domain}/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Token exchange error:", error);
      throw new Error("Failed to exchange code for tokens");
    }

    return response.json();
  }

  async getCurrentUser() {
    try {
      const idToken = await AsyncStorage.getItem("idToken");

      if (!idToken) {
        return null;
      }

      // Decode JWT token (format: header.payload.signature)
      const payload = idToken.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));

      return {
        email: decodedPayload.email,
        name: decodedPayload.name,
        sub: decodedPayload.sub, // Unique user ID
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async isLoggedIn() {
    const token = await AsyncStorage.getItem("idToken");
    return token !== null;
  }

  async signOut() {
    try {
      // 1. Get the access token before clearing
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (accessToken) {
        // 2. Revoke the token with Cognito
        await fetch(`https://${awsConfig.oauth.domain}/oauth2/revoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: accessToken,
            client_id: awsConfig.userPoolWebClientId,
          }).toString(),
        });
      }

      // 3. Clear local tokens
      await AsyncStorage.multiRemove([
        "accessToken",
        "idToken",
        "refreshToken",
      ]);

      // 4. Open browser to Cognito logout endpoint (this clears the session)
      const logoutUrl = `https://${awsConfig.oauth.domain}/logout?client_id=${awsConfig.userPoolWebClientId}&logout_uri=${encodeURIComponent("myapp://")}`;
      await WebBrowser.openAuthSessionAsync(logoutUrl, "myapp://");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local tokens even if revoke fails
      await AsyncStorage.multiRemove([
        "accessToken",
        "idToken",
        "refreshToken",
      ]);
    }
  }

  async getIdToken() {
    return await AsyncStorage.getItem("idToken");
  }

  async getAccessToken() {
    return await AsyncStorage.getItem("accessToken");
  }
}

export default new OAuthService();
