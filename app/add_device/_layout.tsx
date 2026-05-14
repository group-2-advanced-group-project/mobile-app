import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet } from 'react-native';

export default function AddDeviceLayout() {
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => true  // returning true blocks the back action
        );

        return () => backHandler.remove();
    }, []);

    return (
        <Stack
            screenOptions={{
                animation: 'none',
                headerStyle: styles.header,
                headerTitleStyle: styles.headerTitle,
                headerShadowVisible: false,
            }}
        >
            {/* <Stack.Screen name="camera_scanner" options={{ headerShown: false, headerTitle: "Scanner", headerBackTitle: "Back", headerBackButtonDisplayMode: "default"}} /> */}
            <Stack.Screen name="device_instructions" options={{ headerShown: true, headerTitle: "Instructions for Plant Mate!", headerBackTitle: "Back", headerBackButtonDisplayMode: "default", headerBackVisible: true, gestureEnabled: false, headerTintColor: '#fff' }} />
            <Stack.Screen name="esp32_connect" options={{ headerShown: true, headerTitle: "Connect Wifi To Plant Mate!", headerBackTitle: "Back", headerBackButtonDisplayMode: "default", headerBackVisible: false, gestureEnabled: false, }} />
            <Stack.Screen name="plant_form" options={{ headerShown: true, headerTitle: "Add Your Plant", headerBackTitle: "Back", headerBackButtonDisplayMode: "default", headerBackVisible: false, gestureEnabled: false, }} />
        </Stack>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#2e7d32',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.3,
    },
})