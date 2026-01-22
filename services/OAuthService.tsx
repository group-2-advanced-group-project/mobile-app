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
      // For web testing - use window location
      const redirectUri =
        typeof window !== "undefined"
          ? "http://localhost:8081"
          : AuthSession.makeRedirectUri({ scheme: "myapp" });

      console.log("Redirect URI:", redirectUri);

      const request = new AuthSession.AuthRequest({
        clientId: awsConfig.userPoolWebClientId,
        scopes: awsConfig.oauth.scope,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: { identity_provider: "Google" },
      });

      const result = await request.promptAsync(this.discovery);

      if (result.type === "success") {
        const { code } = result.params;
        const tokens = await this.exchangeCodeForTokens(
          code,
          redirectUri,
          request.codeVerifier!,
        );

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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      },
    );

    if (!response.ok) throw new Error("Failed to exchange code for tokens");
    return response.json();
  }

  async signOut() {
    await AsyncStorage.multiRemove(["accessToken", "idToken", "refreshToken"]);
  }

  async getIdToken() {
    return await AsyncStorage.getItem("idToken");
  }
}

export default new OAuthService();
