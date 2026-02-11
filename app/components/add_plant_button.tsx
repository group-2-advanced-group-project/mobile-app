import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import {
    Button
} from 'react-native';

// TODO: MAKE SURE YOU CAN GO BACK FROM QR CODE PAGE AND CANCEL AND THAT QR CODE WILL REDIRECT TO SPECIFIC PAGE

export function AddPlantButton() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();

    const permissionGranted = Boolean(permission?.granted)

    const waitForPermission = async () => {
        if (permissionGranted) {
            router.push("/camera_scanner");
        } else {
            const result = await requestPermission();

            if (result.granted) {
                router.push("/camera_scanner");
            }
        }
    };

    return (
        <Button
            title='Add Plant'
            onPress={waitForPermission}
        />

    )

}