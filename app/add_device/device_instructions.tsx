import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const steps = [
    {
        number: '01',
        title: 'Insert the Sensor',
        description: 'Push the device header firmly into the soil of your plant. Make sure it sits upright and the reader is fully inserted.',
    },
    {
        number: '02',
        title: 'Connect to Power',
        description: 'Plug the device into a nearby wall socket using the provided USB cable and adapter. The indicator light will turn on.',
    },
    {
        number: '03',
        title: 'Set Up Internet',
        description: 'Press Continue below to connect your device to your WiFi network by entering in your WiFi details.',
    },
    {
        number: '04',
        title: 'Register Your Plant',
        description: 'After connecting your device to WiFi, enter in information about your plant and finish the setup through the app.',
    },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 180,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 180,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={styles.cardLeft}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                {index < steps.length - 1 && <View style={styles.connector} />}
            </View>
            <View style={styles.cardRight}>

                <View style={styles.cardText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
            </View>
        </Animated.View>
    );
}

export default function DeviceSetupScreen() {
    const router = useRouter();

    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;

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

        Animated.timing(buttonFade, {
            toValue: 1,
            duration: 500,
            delay: steps.length * 180 + 300,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Background accent */}
            <View style={styles.bgAccent} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
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
                        <Text style={styles.badgeText}>Getting Started</Text>
                    </View>
                    <Text style={styles.title}>Set Up Your{'\n'}PlantMate</Text>
                    <Text style={styles.subtitle}>
                        Follow these steps to get your device up and running.
                    </Text>
                </Animated.View>

                {/* Steps */}
                <View style={styles.steps}>
                    {steps.map((step, index) => (
                        <StepCard key={step.number} step={step} index={index} />
                    ))}
                </View>

                {/* Continue button */}
                <Animated.View style={{ opacity: buttonFade }}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => router.push('/add_device/esp32_connect')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueText}>Continue</Text>
                        <Text style={styles.continueArrow}>→</Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>
                        Make sure your device is powered on before continuing
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
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
        // paddingBottom: 24,
    },
    header: {
        marginBottom: 36,
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
    steps: {
        marginBottom: 20,
    },
    card: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    cardLeft: {
        alignItems: 'center',
        width: 48,
        marginRight: 16,
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '800',
        color: '#4CAF50',
        letterSpacing: 1,
        marginBottom: 8,
    },
    connector: {
        flex: 1,
        width: 2,
        backgroundColor: '#c8e6c9',
        marginBottom: 8,
        borderRadius: 1,
    },
    cardRight: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0f8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    icon: {
        fontSize: 22,
    },
    cardText: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2e1a',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 13,
        color: '#5a7a5a',
        lineHeight: 19,
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
        marginTop: 12,
        lineHeight: 18,
    },
});