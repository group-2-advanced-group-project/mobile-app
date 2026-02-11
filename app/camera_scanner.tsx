import { CameraView } from "expo-camera";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function CameraScanner() {
    return (
        <View style={StyleSheet.absoluteFillObject}>
            <Stack.Screen
                options={{
                    title: "Scanner"
                }}
            />
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={({ data }) => {
                    console.log("data", data)
                }}
            />
        </View>
    );
}