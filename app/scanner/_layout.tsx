import { Stack } from 'expo-router';

export default function CameraLayout() {
    return (
        <Stack
        // screenOptions={{
        //     headerShown: false,
        //     headerTitle: "Scanner",
        //     headerBackTitle: "Back",
        //     headerBackButtonDisplayMode: "default",
        // }}
        >
            {/* <Stack.Screen name="camera_scanner" options={{ headerShown: false, headerTitle: "Scanner", headerBackTitle: "Back", headerBackButtonDisplayMode: "default"}} /> */}
            <Stack.Screen name="esp32_connect" options={{ headerShown: false, headerTitle: "Connext Wifi To Your Plant Mate!", headerBackTitle: "Back", headerBackButtonDisplayMode: "default" }} />
            <Stack.Screen name="plant_form" options={{ headerShown: false, headerTitle: "Add Your Plant", headerBackTitle: "Back", headerBackButtonDisplayMode: "default" }} />
        </Stack>
    );
}