import { ESPDevice, ESPProvisionManager, ESPSecurity, ESPTransport } from '@orbital-systems/react-native-esp-idf-provisioning';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProvisionScreen() {
    const router = useRouter();

    const [devices, setDevices] = useState<ESPDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<ESPDevice | null>(null);
    const [deviceId, setDeviceId] = useState<string>('');
    const [ssid, setSsid] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [provisioned, setProvisioned] = useState<boolean>(false);
    const [provisionFailed, setProvisionFailed] = useState<boolean>(false);

    const resetScreen = (): void => {
        setSelectedDevice(null);
        setDeviceId('');
        setDevices([]);
        setSsid('');
        setPassword('');
        setStatus('');
        setProvisioned(false);
        setProvisionFailed(false);
        setLoading(false);
    };

    // Request all necessary permissions
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setStatus('Location permission denied');
                    return false;
                }

                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                const allGranted = Object.values(granted).every(
                    (result) => result === PermissionsAndroid.RESULTS.GRANTED
                );

                if (!allGranted) {
                    setStatus('Bluetooth permissions denied');
                    return false;
                }

                return true;
            } catch (error) {
                setStatus(`Permission error: ${(error as Error).message}`);
                return false;
            }
        }
        return true;
    };

    // Step 1 — Scan for ESP32 devices nearby over BLE
    const scanDevices = async (): Promise<void> => {
        setLoading(true);
        setDevices([]);
        setStatus('Requesting permissions...');

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
            setLoading(false);
            return;
        }

        setStatus('Scanning for devices...');
        try {
            const foundDevices: ESPDevice[] = await ESPProvisionManager.searchESPDevices(
                'PROV_',
                ESPTransport.ble,
                ESPSecurity.secure
            );
            setDevices(foundDevices);
            setStatus(
                foundDevices.length > 0
                    ? `Found ${foundDevices.length} device(s)`
                    : 'No devices found. Make sure your device is powered on.'
            );
        } catch (error) {
            setStatus(`Scan failed: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    // Step 2 — Connect to the ESP32
    const connectToDevice = async (device: ESPDevice): Promise<void> => {
        setLoading(true);
        setStatus('Connecting...');
        try {
            await device.connect('abcd1234');
            setSelectedDevice(device);

            const extractedDeviceId = device.name.replace('PROV_', '');
            setDeviceId(extractedDeviceId);

            setStatus('Connected! Enter your WiFi credentials below.');
        } catch (error) {
            setStatus(`Connection failed: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    // Step 3 — Send WiFi credentials then wait for device to connect
    const provisionDevice = async (): Promise<void> => {
    if (!selectedDevice) return;
    if (!ssid || !password) {
        setStatus('Please enter both SSID and password');
        return;
    }

    setLoading(true);
    setStatus('Sending credentials to device...');

    try {
        // Race provision against a 35 second timeout
        // (matches ESP32's retry attempts before it resets)
        await Promise.race([
            selectedDevice.provision(ssid, password),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out')), 15000)
            )
        ]);

        setProvisioned(true);

        for (let i = 10; i > 0; i--) {
            setStatus(`Credentials sent! Waiting for device to connect... ${i}s`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setLoading(false);
        router.push('/scanner/plant_form');

    } catch (error) {
        const errorMessage = (error as Error).message.toLowerCase();

        setLoading(false);
        setProvisionFailed(true);
        setProvisioned(false);

        if (errorMessage.includes('timed out')) {
            setStatus('Device took too long to connect. Check your credentials.');
        } else if (errorMessage.includes('auth') || errorMessage.includes('password')) {
            setStatus('Wrong password entered.');
        } else if (errorMessage.includes('ap not found') || errorMessage.includes('network')) {
            setStatus('Network not found.');
        } else {
            setStatus(`Connection failed: ${(error as Error).message}`);
        }

        // Auto reset after 5 seconds
        for (let i = 5; i > 0; i--) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        resetScreen();
    }
};

    // Failure screen
    if (provisionFailed) {
        return (
            <View style={styles.container}>
                <View style={styles.failureBox}>
                    <Text style={styles.failureIcon}>✗</Text>
                    <Text style={styles.failureTitle}>Connection Failed</Text>
                    <Text style={styles.failureMessage}>
                        Could not connect the device to WiFi. This could be due to wrong credentials or the device being out of range.
                    </Text>
                    {status ? (
                        <Text style={styles.failureCountdown}>{status}</Text>
                    ) : null}
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={resetScreen}>
                    <Text style={styles.retryButtonText}>Try Again Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Connect Device</Text>

            {/* Status message */}
            {status ? (
                <View style={[
                    styles.statusBox,
                    provisioned ? styles.statusSuccess : styles.statusInfo
                ]}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            ) : null}

            {/* Loading indicator */}
            {loading && <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />}

            {/* Device ID badge */}
            {deviceId ? (
                <View style={styles.deviceIdBox}>
                    <Text style={styles.deviceIdLabel}>Device ID</Text>
                    <Text style={styles.deviceIdValue}>{deviceId}</Text>
                </View>
            ) : null}

            {/* Scan button */}
            {!selectedDevice && !loading && (
                <TouchableOpacity style={styles.button} onPress={scanDevices}>
                    <Text style={styles.buttonText}>Scan for Devices</Text>
                </TouchableOpacity>
            )}

            {/* Device list */}
            {!selectedDevice && devices.length > 0 && (
                <FlatList
                    data={devices}
                    keyExtractor={(item) => item.name}
                    style={styles.deviceList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.deviceItem}
                            onPress={() => connectToDevice(item)}
                            disabled={loading}
                        >
                            <Text style={styles.deviceName}>{item.name}</Text>
                            <Text style={styles.deviceConnect}>Tap to connect →</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* WiFi credentials form */}
            {selectedDevice && !provisioned && (
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Enter WiFi Credentials</Text>
                    <TextInput
                        placeholder="WiFi Network Name (SSID)"
                        value={ssid}
                        onChangeText={setSsid}
                        style={styles.input}
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    <TextInput
                        placeholder="WiFi Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={styles.input}
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={provisionDevice}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Connect Device</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            setSelectedDevice(null);
                            setDeviceId('');
                            setDevices([]);
                            setStatus('');
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.backButtonText}>← Choose a different device</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1a1a1a',
    },
    statusBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    statusInfo: {
        backgroundColor: '#e8f4fd',
    },
    statusSuccess: {
        backgroundColor: '#e8f5e9',
    },
    statusText: {
        fontSize: 14,
        color: '#333',
    },
    loader: {
        marginBottom: 16,
    },
    deviceIdBox: {
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    deviceIdLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    deviceIdValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonDisabled: {
        backgroundColor: '#a5d6a7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deviceList: {
        marginTop: 8,
    },
    deviceItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    deviceConnect: {
        fontSize: 13,
        color: '#4CAF50',
    },
    form: {
        marginTop: 8,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#1a1a1a',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 15,
    },
    backButton: {
        alignItems: 'center',
        padding: 10,
    },
    backButtonText: {
        color: '#888',
        fontSize: 14,
    },
    failureBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    failureIcon: {
        fontSize: 64,
        color: '#f44336',
        marginBottom: 16,
    },
    failureTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    failureMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    failureCountdown: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    },
    retryButton: {
        backgroundColor: '#f44336',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 24,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});