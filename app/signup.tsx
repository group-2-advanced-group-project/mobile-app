// app/signup.tsx

import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import OAuthService from "../services/OAuthService";

export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await OAuthService.signInWithGoogle();
      router.replace("/profile");
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#4285F4" />
        ) : (
          <Text style={styles.googleButtonText}>Sign up with Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>
          Already have an account?{" "}
          <Text style={styles.linkTextBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  googleButton: {
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#4285F4",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  googleButtonText: { color: "#4285F4", fontSize: 16, fontWeight: "600" },
  linkText: { color: "#666", textAlign: "center", fontSize: 14, marginTop: 20 },
  linkTextBold: { color: "#4285F4", fontWeight: "600" },
});
