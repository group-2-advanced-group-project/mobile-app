import { ESPDevice, ESPProvisionManager, ESPSecurity, ESPTransport } from '@orbital-systems/react-native-esp-idf-provisioning';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Button, FlatList, PermissionsAndroid, Platform, Text, TextInput, View } from 'react-native';

export default function ProvisionScreen() {
    const [devices, setDevices] = useState<ESPDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<ESPDevice | null>(null);
    const [ssid, setSsid] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Request all necessary permissions
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                // Request location permission via expo-location
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setStatus('Location permission denied');
                    return false;
                }

                // Request Bluetooth permissions
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
        setStatus('Requesting permissions...');

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
            setLoading(false);
            return;
        }

        setStatus('Scanning...');
        try {
            const foundDevices: ESPDevice[] = await ESPProvisionManager.searchESPDevices(
                'PROV_',
                ESPTransport.ble,
                ESPSecurity.secure
            );
            setDevices(foundDevices);
            setStatus(`Found ${foundDevices.length} device(s)`);
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
            await device.connect('abcd1234'); // Must match your `pop` in ESP32 code
            setSelectedDevice(device);
            setStatus('Connected! Enter your WiFi credentials below.');
        } catch (error) {
            setStatus(`Connection failed: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    // Step 3 — Send WiFi credentials
    const provisionDevice = async (): Promise<void> => {
        if (!selectedDevice) return;
        if (!ssid || !password) {
            setStatus('Please enter both SSID and password');
            return;
        }
        setLoading(true);
        setStatus('Sending credentials...');
        try {
            await selectedDevice.provision(ssid, password);
            setStatus('Device provisioned! It will now connect to your WiFi.');
            setSelectedDevice(null);
            setDevices([]);
        } catch (error) {
            setStatus(`Provisioning failed: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
                PlantMate Setup
            </Text>

            {/* Status */}
            <Text style={{ marginBottom: 10, color: 'gray' }}>{status}</Text>

            {/* Loading indicator */}
            {loading && <ActivityIndicator size="large" style={{ marginBottom: 10 }} />}

            {/* Scan button */}
            {!selectedDevice && (
                <Button title="Scan for PlantMate" onPress={scanDevices} disabled={loading} />
            )}

            {/* Device list */}
            {!selectedDevice && (
                <FlatList
                    data={devices}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                        <View style={{ marginTop: 10 }}>
                            <Text>{item.name}</Text>
                            <Button
                                title="Connect"
                                onPress={() => connectToDevice(item)}
                                disabled={loading}
                            />
                        </View>
                    )}
                />
            )}

            {/* WiFi credentials form */}
            {selectedDevice && (
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                        Connected to: {selectedDevice.name}
                    </Text>
                    <TextInput
                        placeholder="WiFi Network Name (SSID)"
                        value={ssid}
                        onChangeText={setSsid}
                        style={{ borderWidth: 1, borderColor: 'gray', padding: 8, marginBottom: 10, borderRadius: 5 }}
                        autoCapitalize="none"
                    />
                    <TextInput
                        placeholder="WiFi Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={{ borderWidth: 1, borderColor: 'gray', padding: 8, marginBottom: 10, borderRadius: 5 }}
                        autoCapitalize="none"
                    />
                    <Button
                        title="Send to Device"
                        onPress={provisionDevice}
                        disabled={loading}
                    />
                </View>
            )}
        </View>
    );
};