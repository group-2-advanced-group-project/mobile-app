import { awsConfig } from "@/config/aws-config";
import { AuthTokens } from "@/types/auth.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from '@react-native-firebase/messaging';
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

class AuthService {
  // Cognito endpoints
  private readonly authEndpoint = `https://${awsConfig.oauth.domain}/oauth2/authorize`;
  private readonly tokenEndpoint = `https://${awsConfig.oauth.domain}/oauth2/token`;
  private readonly revokeEndpoint = `https://${awsConfig.oauth.domain}/oauth2/revoke`;

  async signInWithGoogle(onBrowserClose?: () => void): Promise<AuthTokens> {
    try {
      const redirectUri = this.getRedirectUri();

      const request = new AuthSession.AuthRequest({
        clientId: awsConfig.userPoolWebClientId,
        scopes: awsConfig.oauth.scope,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          identity_provider: 'Google',
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: this.authEndpoint,
      });

      // Browser has closed - notify the UI immediately
      // so it can show a loading screen while we finish
      onBrowserClose?.();

      if (result.type === 'success') {
        const { code } = result.params;

        const tokens = await this.exchangeCodeForTokens(
          code,
          redirectUri,
          request.codeVerifier!,
        );

        await this.saveTokens(tokens);
        console.log(tokens.idToken)
        const authStatus = await messaging().hasPermission();
        console.log('Notification permission status:', authStatus);

        try {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (enabled) {
            const token = await messaging().getToken();
            await AsyncStorage.setItem("fcmToken", token);
            console.log(token);

            // Fetch all devices for this user
            const devicesRes = await fetch(
              'https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com/users/devices',
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${tokens.idToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (devicesRes.ok) {
              const devices = await devicesRes.json();

              // Send FCM token to every device in parallel
              await Promise.all(
                devices.map((device: { device_id: string }) =>
                  fetch('https://w9xrldhhs4.execute-api.eu-west-2.amazonaws.com/users/fcm-token', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${tokens.idToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      device_id: device.device_id,
                      fcm_token: token,
                    }),
                  })
                )
              );

              console.log(`FCM token sent to ${devices.length} device(s)`);
            } else {
              console.warn('Could not fetch devices to register FCM token');
            }
          } else {
            console.warn('Notification permission denied - FCM token not sent');
          }
        } catch (fcmError) {
          console.warn('Failed to register FCM token:', fcmError);
        }
        // ... rest of your FCM token logic stays exactly the same

        return tokens;
      }

      throw new Error('Authentication was cancelled or failed');
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }

  async getIdToken(): Promise<string | null> {
    return await AsyncStorage.getItem("idToken");
  }

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem("refreshToken");
  }

  async refreshTokens(): Promise<AuthTokens> {
    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Request new tokens
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: awsConfig.userPoolWebClientId,
        refresh_token: refreshToken,
      });

      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh tokens: ${error}`);
      }

      const data = await response.json();

      const newTokens: AuthTokens = {
        accessToken: data.access_token,
        idToken: data.id_token,
        refreshToken: data.refresh_token || refreshToken, // Use old one if not returned
      };
      await this.saveTokens(newTokens);

      return newTokens;
    } catch (error) {
      console.error("Token refresh error:", error);
      // Clear tokens if refresh fails (user needs to re-authenticate)
      await this.clearTokens();
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();

      if (refreshToken) {
        await fetch(this.revokeEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: refreshToken,
            client_id: awsConfig.userPoolWebClientId,
          }).toString(),
        });
      }

      await this.clearTokens();

      const redirectUri = this.getRedirectUri();
      console.log(redirectUri);

      const logoutUrl =
        `https://${awsConfig.oauth.domain}/logout` +
        `?client_id=${awsConfig.userPoolWebClientId}` +
        `&logout_uri=${encodeURIComponent(redirectUri)}`;
      console.log(logoutUrl);

      await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
    } catch (error) {
      console.error("Sign out error:", error);
      await this.clearTokens();
    }
  }

  /* Private/helper methods */

  private getRedirectUri(): string {
    return AuthSession.makeRedirectUri({
      scheme: "myapp",
      // preferLocalhost: true, // Important for Expo Go
    });
  }

  private async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ): Promise<AuthTokens> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: awsConfig.userPoolWebClientId,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
    };
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    // saves tokens onto device storage
    await AsyncStorage.multiSet([
      ["accessToken", tokens.accessToken],
      ["idToken", tokens.idToken],
      ["refreshToken", tokens.refreshToken],
    ]);
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(["accessToken", "idToken", "refreshToken"]);
  }
}

export default new AuthService();
