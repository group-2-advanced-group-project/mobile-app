import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Dropdown from 'react-native-input-select';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function PlantForm() {
    const router = useRouter();
    const { deviceId } = useLocalSearchParams<{ deviceId: string }>();

    const [plantName, setPlantName] = useState('');
    const [plantType, setPlantType] = useState('');
    const [plantLocation, setPlantLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

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

        // Block Android hardware back button
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                setShowWarning(true);
                return true;
            }
        );

        return () => backHandler.remove();
    }, []);

    const handleAddPlant = async () => {
        if (!plantName || !plantType || !plantLocation) {
            return;
        }

        setLoading(true);
        try {
            const idToken = await AsyncStorage.getItem('idToken');
            const fcmToken = await AsyncStorage.getItem('fcmToken');
            console.log(fcmToken)

            const response = await fetch(
                'https://w9xrldhhs4.execute-api.eu-west-2.amazonaws.com/devices/link',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        device_id: deviceId,
                        plant_name: plantName,
                        plant_type: plantType,
                        location: plantLocation,
                        fcm_token: fcmToken,
                    }),
                }
            );

            const authStatus = await messaging().hasPermission();
            console.log('Notification permission status:', authStatus);

            try {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (enabled) {
                    const token = await messaging().getToken();
                    // await AsyncStorage.setItem("fcmToken", token);
                    await fetch('https://w9xrldhhs4.execute-api.eu-west-2.amazonaws.com/users/fcm-token', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${idToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            device_id: deviceId,
                            fcm_token: token,
                        }),
                    });
                } else {
                    console.warn('Notification permission denied - FCM token not sent');
                }
            } catch (fcmError) {
                console.warn('Failed to register FCM token:', fcmError);
            }

            if (!response.ok) {
                console.error('Failed to add plant:', response.status);
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log(data);
            router.replace('/(tabs)/main_plant');
        } catch (error) {
            console.error('Error adding plant:', error);
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerBackVisible: false,
                    gestureEnabled: false,
                }}
            />

            {/* Warning modal when user tries to go back */}
            <Modal
                visible={showWarning}
                transparent
                animationType="fade"
                onRequestClose={() => setShowWarning(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalIcon}>⚠️</Text>
                        <Text style={styles.modalTitle}>Don't close the app!</Text>
                        <Text style={styles.modalMessage}>
                            If you restart or close the app now, you will need to factory reset your device and start the setup from the beginning.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowWarning(false)}
                        >
                            <Text style={styles.modalButtonText}>Continue Setup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.container}>
                    <View style={styles.bgAccent} />

                    <KeyboardAwareScrollView
                        contentContainerStyle={styles.scroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
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
                                <Text style={styles.badgeText}>Almost Done</Text>
                            </View>
                            <Text style={styles.title}>Name Your{'\n'}Plant</Text>
                            <Text style={styles.subtitle}>
                                Tell us a little about your plant so we can track it properly.
                            </Text>
                        </Animated.View>

                        {/* Warning banner */}
                        <Animated.View
                            style={[
                                styles.warningBanner,
                                {
                                    opacity: contentFade,
                                    transform: [{ translateY: contentSlide }],
                                },
                            ]}
                        >
                            <Text style={styles.warningIcon}>⚠️</Text>
                            <Text style={styles.warningText}>
                                Do not close or restart the app. You would need to factory reset your device to set it up again.
                            </Text>
                        </Animated.View>

                        {/* Device ID badge */}
                        {deviceId ? (
                            <Animated.View
                                style={[
                                    styles.deviceIdBox,
                                    {
                                        opacity: contentFade,
                                        transform: [{ translateY: contentSlide }],
                                    },
                                ]}
                            >
                                <Text style={styles.deviceIdLabel}>Device ID</Text>
                                <Text style={styles.deviceIdValue}>{deviceId}</Text>
                            </Animated.View>
                        ) : null}

                        {/* Form */}
                        <Animated.View
                            style={{
                                opacity: contentFade,
                                transform: [{ translateY: contentSlide }],
                            }}
                        >
                            <Text style={styles.sectionLabel}>PLANT DETAILS</Text>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Plant Name</Text>
                                <TextInput
                                    placeholder="e.g. My little fern"
                                    placeholderTextColor="#aaa"
                                    onChangeText={setPlantName}
                                    value={plantName}
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Plant Species</Text>
                                <Dropdown
                                    placeholder="Select your plant..."
                                    options={[
                                        { label: 'Spider Plant', value: 'spider_plant' },
                                        { label: 'Rose', value: 'rose' },
                                        { label: 'Cactus', value: 'cactus' },
                                        { label: 'Aloe', value: 'aloe' },
                                        { label: 'Pothos', value: 'pothos' },
                                        { label: 'Peace Lily', value: 'peace_lily' },
                                    ]}
                                    selectedValue={plantType}
                                    onValueChange={(value: string) => setPlantType(value)}
                                    primaryColor="#2e7d32"
                                    dropdownStyle={styles.dropdown}
                                    dropdownContainerStyle={styles.dropdownContainer}
                                    placeholderStyle={{ color: '#aaa', fontSize: 15 }}
                                    selectedItemStyle={{ color: '#1a2e1a', fontSize: 15 }}
                                    dropdownIconStyle={styles.dropdownIcon}
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Location</Text>
                                <TextInput
                                    placeholder="e.g. Living Room, Bedroom"
                                    placeholderTextColor="#aaa"
                                    onChangeText={setPlantLocation}
                                    value={plantLocation}
                                    style={styles.input}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.continueButton,
                                    (loading || !plantName || !plantType || !plantLocation) &&
                                    styles.buttonDisabled,
                                ]}
                                onPress={handleAddPlant}
                                disabled={loading || !plantName || !plantType || !plantLocation}
                            >
                                <Text style={styles.continueText}>
                                    {loading ? 'Adding Plant...' : 'Add Plant'}
                                </Text>
                                {!loading && (
                                    <Text style={styles.continueArrow}>→</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.hint}>
                                Make sure all fields are filled in before continuing
                            </Text>
                        </Animated.View>
                    </KeyboardAwareScrollView>
                </View>
            </KeyboardAvoidingView>
        </>
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
        marginBottom: 24,
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
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff8e1',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#f9a825',
        gap: 10,
    },
    warningIcon: {
        fontSize: 16,
        marginTop: 1,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#6d4c00',
        lineHeight: 19,
        fontWeight: '500',
    },
    deviceIdBox: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
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
    inputWrapper: {
        marginBottom: 16,
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
    dropdown: {
        borderWidth: 1.5,
        borderColor: '#d4e9cc',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        minHeight: 51,
        paddingHorizontal: 14,
        paddingVertical: 0,
    },
    dropdownContainer: {
        marginBottom: 0,
    },
    dropdownIcon: {
        top: 0,
        bottom: 0,
        justifyContent: 'center',
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
        marginTop: 8,
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
    hint: {
        textAlign: 'center',
        fontSize: 12,
        color: '#8aaa8a',
        lineHeight: 18,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    modalBox: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    modalIcon: {
        fontSize: 40,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a2e1a',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    modalMessage: {
        fontSize: 14,
        color: '#5a7a5a',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#2e7d32',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});