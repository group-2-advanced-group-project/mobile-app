import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AuthService from '../services/AuthService';

export default function Index() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const idToken = await AsyncStorage.getItem('idToken');
                const refreshToken = await AsyncStorage.getItem('refreshToken');

                if (!idToken || !refreshToken) {
                    // No tokens saved at all - go to login
                    setIsLoggedIn(false);
                    return;
                }

                // Try to refresh tokens to make sure they're still valid
                await AuthService.refreshTokens();
                setIsLoggedIn(true);

            } catch {
                // Refresh failed - tokens expired or invalid, go to login
                setIsLoggedIn(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoggedIn === null) {
        return (
            <View style={{ flex: 1, backgroundColor: '#f4f7f2', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2e7d32" />
            </View>
        );
    }

    if (isLoggedIn) {
        return <Redirect href="/(tabs)/main_plant" />;
    }

    return <Redirect href="/login" />;
}