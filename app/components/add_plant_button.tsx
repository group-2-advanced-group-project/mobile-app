import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export function AddPlantButton() {
    const router = useRouter();
    // USED PREVIOUSLY FOR QR CODE IMPLEMENTATION
    // const [permission, requestPermission] = useCameraPermissions();

    // const permissionGranted = Boolean(permission?.granted);

    // const waitForPermission = async () => {
    //     if (permissionGranted) {
    //         router.push('/add_device');
    //     } else {
    //         const result = await requestPermission();
    //         if (result.granted) {
    //             router.push('/add_device');
    //         }
    //     }
    // };

    return (
        <TouchableOpacity style={styles.button} onPress={() => router.push('add_device')} activeOpacity={0.8}>
            <Plus size={14} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.buttonText}>Add Plant</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#2e7d32',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        marginRight: 12,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});