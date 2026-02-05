import { AuthTokens } from "@/types/auth.types";

class AuthService {
  async signUp(email: string, password: string): Promise<void> {
    // traditional sign up with email and password
  }

  async signIn(email: string, password: string): Promise<AuthTokens> {
    // traditional sign in with email and password
  }

  async signInWithGoogle(): Promise<AuthTokens> {
    // OAuth sign in (and sign up) with google
  }

  async refreshTokens(): Promise<AuthTokens> {
    // handles refresh token logic
  }

  async signOut(): Promise<void> {
    // handles sign out
  }

  /* Private/helper methods */
  private async saveTokens(tokens: AuthTokens): Promise<void> {
    // saves tokens onto device storage
  }

  private async getTokens(): Promise<AuthTokens | null> {
    // return tokens
  }

  private async clearTokens(): Promise<void> {
    // clears tokens
  }
}

export default new AuthService();
