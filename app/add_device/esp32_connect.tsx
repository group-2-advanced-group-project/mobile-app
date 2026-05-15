import { ESPDevice, ESPProvisionManager, ESPSecurity, ESPTransport } from '@orbital-systems/react-native-esp-idf-provisioning';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Sprout } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width } = Dimensions.get('window');

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

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(headerSlide, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.parallel([
            Animated.timing(contentFade, {
                toValue: 1,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
            }),
            Animated.timing(contentSlide, {
                toValue: 0,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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
                'PROV_PLANT_MATE',
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

    const provisionDevice = async (): Promise<void> => {
        if (!selectedDevice) return;
        if (!ssid || !password) {
            setStatus('Please enter both SSID and password');
            return;
        }

        setLoading(true);
        setStatus('Sending credentials to device...');

        try {
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
            console.log(deviceId)
            router.replace(`/add_device/plant_form?deviceId=${deviceId}`);

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
                <View style={styles.bgAccent} />
                <View style={styles.failureBox}>
                    <View style={styles.failureIconCircle}>
                        <Text style={styles.failureIcon}>✗</Text>
                    </View>
                    <Text style={styles.failureTitle}>Connection Failed</Text>
                    <Text style={styles.failureMessage}>
                        Could not connect the device to WiFi. This could be due to wrong credentials or the device being out of range.
                    </Text>
                    {status ? (
                        <View style={styles.failureStatusBox}>
                            <Text style={styles.failureCountdown}>{status}</Text>
                        </View>
                    ) : null}
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={resetScreen}>
                    <Text style={styles.retryButtonText}>Try Again Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        // <KeyboardAvoidingView
        //     style={{ flex: 1 }}
        //     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // >
            <View style={styles.container}>
                <View style={styles.bgAccent} />

                <KeyboardAwareScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    enableOnAndroid={true}
                    extraScrollHeight={20}
                >
                    {/* Header */}
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: headerFade,
                                transform: [{ translateY: headerSlide }],
                            },
                        ]}
                    >
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Step 3</Text>
                        </View>
                        <Text style={styles.title}>Connect to{'\n'}WiFi</Text>
                        <Text style={styles.subtitle}>
                            Scan for your PlantMate device and enter your WiFi credentials to get it online.
                        </Text>
                    </Animated.View>

                    {/* Main content */}
                    <Animated.View
                        style={{
                            opacity: contentFade,
                            transform: [{ translateY: contentSlide }],
                        }}
                    >
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
                        {loading && (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color="#4CAF50" />
                            </View>
                        )}

                        {/* Device ID badge */}
                        {deviceId ? (
                            <View style={styles.deviceIdBox}>
                                <Text style={styles.deviceIdLabel}>Connected Device</Text>
                                <Text style={styles.deviceIdValue}>{deviceId}</Text>
                            </View>
                        ) : null}

                        {/* Scan button */}
                        {!selectedDevice && !loading && (
                            <TouchableOpacity style={styles.continueButton} onPress={scanDevices}>
                                <Text style={styles.continueText}>Scan for Devices</Text>
                                <Text style={styles.continueArrow}>→</Text>
                            </TouchableOpacity>
                        )}

                        {/* Device list */}
                        {!selectedDevice && devices.length > 0 && (
                            <View style={styles.deviceListContainer}>
                                <Text style={styles.sectionLabel}>NEARBY DEVICES</Text>
                                {devices.map((item) => (
                                    <TouchableOpacity
                                        key={item.name}
                                        style={styles.deviceItem}
                                        onPress={() => connectToDevice(item)}
                                        disabled={loading}
                                    >
                                        <View style={styles.deviceIconCircle}>
                                            <Text style={styles.deviceIcon}><Sprout size={20} color="#2e7d32" /></Text>
                                        </View>
                                        <View style={styles.deviceTextGroup}>
                                            <Text style={styles.deviceName}>{item.name}</Text>
                                            <Text style={styles.deviceSub}>Tap to connect</Text>
                                        </View>
                                        <Text style={styles.deviceArrow}>→</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* WiFi credentials form */}
                        {selectedDevice && !provisioned && (
                            <View style={styles.form}>
                                <Text style={styles.sectionLabel}>WIFI CREDENTIALS</Text>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Network Name (SSID)</Text>
                                    <TextInput
                                        placeholder="e.g. HomeWiFi"
                                        placeholderTextColor="#aaa"
                                        value={ssid}
                                        onChangeText={setSsid}
                                        style={styles.input}
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <TextInput
                                        placeholder="Enter your WiFi password"
                                        placeholderTextColor="#aaa"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        style={styles.input}
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.continueButton, loading && styles.buttonDisabled]}
                                    onPress={provisionDevice}
                                    disabled={loading}
                                >
                                    <Text style={styles.continueText}>Connect Device</Text>
                                    <Text style={styles.continueArrow}>→</Text>
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
                    </Animated.View>
                </KeyboardAwareScrollView>
            </View>
        // </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f2',
    },
    bgAccent: {
        position: 'absolute',
        top: -80,
        right: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: '#d4e9cc',
        opacity: 0.5,
    },
    scroll: {
        padding: 20,
        paddingTop: 12,
    },
    header: {
        marginBottom: 32,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#c8e6c9',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 14,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2e7d32',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a2e1a',
        lineHeight: 42,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#5a7a5a',
        lineHeight: 22,
        fontWeight: '400',
    },
    statusBox: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusInfo: {
        backgroundColor: '#e3f0ff',
    },
    statusSuccess: {
        backgroundColor: '#e8f5e9',
    },
    statusText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    loadingBox: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    deviceIdBox: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
        shadowColor: '#2e7d32',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    deviceIdLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4CAF50',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    deviceIdValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2e1a',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8aaa8a',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    deviceListContainer: {
        marginBottom: 20,
    },
    deviceItem: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    deviceIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0f8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    deviceIcon: {
        fontSize: 20,
    },
    deviceTextGroup: {
        flex: 1,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a2e1a',
        marginBottom: 2,
    },
    deviceSub: {
        fontSize: 12,
        color: '#8aaa8a',
    },
    deviceArrow: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '700',
    },
    form: {
        marginTop: 4,
    },
    inputWrapper: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5a7a5a',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#d4e9cc',
        backgroundColor: '#ffffff',
        padding: 14,
        borderRadius: 12,
        fontSize: 15,
        color: '#1a2e1a',
    },
    continueButton: {
        backgroundColor: '#2e7d32',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        marginBottom: 12,
    },
    buttonDisabled: {
        backgroundColor: '#a5d6a7',
        shadowOpacity: 0,
        elevation: 0,
    },
    continueText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    continueArrow: {
        color: '#a5d6a7',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        alignItems: 'center',
        padding: 10,
    },
    backButtonText: {
        color: '#8aaa8a',
        fontSize: 14,
    },

    // Failure screen
    failureBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    failureIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fdecea',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    failureIcon: {
        fontSize: 36,
        color: '#f44336',
    },
    failureTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a2e1a',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    failureMessage: {
        fontSize: 15,
        color: '#5a7a5a',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    failureStatusBox: {
        backgroundColor: '#fdecea',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    failureCountdown: {
        fontSize: 14,
        color: '#c62828',
        textAlign: 'center',
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#f44336',
        margin: 24,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#f44336',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});