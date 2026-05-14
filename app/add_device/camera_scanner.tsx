
// OLD IMPLEMENTATION OF GETTING DEVICE ID THROUGH QR CODE

import { CameraView } from "expo-camera";
import { useRouter } from 'expo-router';
import { useEffect, useRef } from "react";
import { Alert, AppState, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScanner() {
    const router = useRouter();

    const qrLock = useRef(false);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                qrLock.current = false;
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);



    return (
        <SafeAreaView style={StyleSheet.absoluteFillObject}>
            <View style={StyleSheet.absoluteFillObject}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={({ data }) => {
                        if (data && !qrLock.current) {
                            qrLock.current = true;
                            setTimeout(async () => {
                                try {
                                    const qr_json = JSON.parse(data);

                                    if (!qr_json.device_id || !qr_json.device_id.startsWith("PLANT_MATE_")) {
                                        Alert.alert(
                                            "Invalid QR Code",
                                            "Please scan a valid PlantMate QR code.",
                                            [{ text: "Try Again", onPress: () => qrLock.current = false }]
                                        );
                                        return;
                                    }

                                    // router.push(`/scanner/plant_form?device_id=${qr_json.device_id}`);
                                    router.push('/scanner/esp32_connect');
                                } catch (e) {
                                    Alert.alert(
                                        "Invalid QR Code",
                                        "Please scan a valid PlantMate QR code.",
                                        [{ text: "Try Again", onPress: () => qrLock.current = false }]
                                    );
                                }
                            }, 500);
                        }
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

// onBarcodeScanned={({ data }) => {
//     console.log("data", data)
//     router.push("/scanner/plant_form")

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    }
});