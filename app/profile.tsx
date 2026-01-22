// app/profile.tsx

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OAuthService from "../services/OAuthService";

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const idToken = await OAuthService.getIdToken();
    if (!idToken) {
      router.replace("/login");
      return;
    }
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    setUserEmail(payload.email || "Unknown");
  };

  const handleLogout = async () => {
    await OAuthService.signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {userEmail.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{userEmail}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.successText}>✓ Logged In</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  infoContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  label: { fontSize: 12, color: "#666", marginBottom: 5 },
  value: { fontSize: 16, color: "#333" },
  successText: { fontSize: 16, color: "#34C759", fontWeight: "600" },
  logoutButton: {
    height: 50,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
