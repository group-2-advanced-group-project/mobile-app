import { useRouter } from "expo-router";
import { Leaf, Sprout } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AuthService from "../services/AuthService";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await AuthService.signInWithGoogle(() => {
        // Switch to full screen loading immediately when browser closes
        setSigningIn(true);
      });

      router.replace('/(tabs)/main_plant');

    } catch (error: any) {
      // Only show login page again if it was actually an error
      // not a cancellation
      if (error.message !== 'Authentication was cancelled or failed') {
        Alert.alert('Login Failed', error.message);
      }
      setLoading(false);
      setSigningIn(false);
    }
  };

  // Full screen loading overlay shown after auth completes
  if (signingIn) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.bgAccentTopLeft} />
        <View style={styles.bgAccentBottomRight} />
        <View style={styles.loadingCard}>
          <Text style={styles.loadingEmoji}><Sprout size={56} color={"#2e7d32"} /></Text>
          <Text style={styles.loadingTitle}>Getting things ready...</Text>
          <Text style={styles.loadingSubtitle}>
            Setting up your PlantMate experience
          </Text>
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loadingSpinner}
          />
        </View>
      </View>
    );
  }

  // Show a blank green screen while loading state is true
  // to prevent the login page flickering back into view
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.bgAccentTopLeft} />
        <View style={styles.bgAccentBottomRight} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background accent */}
      <View style={styles.bgAccentTopLeft} />
      <View style={styles.bgAccentBottomRight} />

      {/* Logo / branding */}
      <View style={styles.brandSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}><Leaf size={48} color="#c8e6c9" /></Text>
        </View>
        <Text style={styles.appName}>PlantMate</Text>
        {/* <Text style={styles.appTagline}>
                    Keep your plants happy and healthy
                </Text> */}
      </View>

      {/* Login card */}
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Get Started</Text>
        </View>
        <Text style={styles.title}>Welcome{'\n'}Back</Text>
        <Text style={styles.subtitle}>
          Sign in to monitor your plants and track their health.
        </Text>

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.googleButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#2e7d32" />
          ) : (
            <View style={styles.googleButtonInner}>
              {/* <Text style={styles.googleLogo}>G</Text> */}
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f2',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },

  // Background accents
  bgAccentTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#c8e6c9',
    opacity: 0.5,
  },
  bgAccentBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#d4e9cc',
    opacity: 0.4,
  },

  // Branding
  brandSection: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2e7d32',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 4,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1a2e1a',
    letterSpacing: -1,
  },
  appTagline: {
    fontSize: 15,
    color: '#5a7a5a',
    fontWeight: '400',
    textAlign: 'center',
  },

  // Login card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#c8e6c9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1a2e1a',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#5a7a5a',
    lineHeight: 21,
    marginBottom: 28,
  },

  // Google button
  googleButton: {
    height: 54,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d4e9cc',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleLogo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleButtonText: {
    color: '#1a2e1a',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#8aaa8a',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Loading screen
  loadingScreen: {
    flex: 1,
    backgroundColor: '#f4f7f2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#2e7d32',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    gap: 8,
  },
  loadingEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a2e1a',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#5a7a5a',
    textAlign: 'center',
    lineHeight: 21,
  },
  loadingSpinner: {
    marginTop: 16,
  },
});