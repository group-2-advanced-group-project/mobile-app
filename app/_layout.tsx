import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true  // returning true blocks the back action
        );

        return () => backHandler.remove();
    }, []);

    return (
        <SafeAreaProvider>
            <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="add_device"
                    options={{
                        headerShown: false,
                        headerTitle: "Add Your Plant!",
                        headerBackButtonMenuEnabled: true,
                        headerBackTitle: "Back"
                    }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaProvider>
    );
}