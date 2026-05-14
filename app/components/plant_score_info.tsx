import { Info, Timer, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export function InfoButton() {
    const [visible, setVisible] = useState(false);

    return (
        <>
            {/* Header button */}
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setVisible(true)}
                activeOpacity={0.8}
            >
                <Info size={16} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.headerButtonText}>Info</Text>
            </TouchableOpacity>

            {/* Info modal */}
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>

                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setVisible(false)}
                        >
                            <X size={18} color="#8aaa8a" />
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={styles.title}>About Plant Score</Text>

                        {/* Content */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How it works</Text>
                            <Text style={styles.sectionBody}>
                                Your plant's health score is calculated by a machine learning model
                                that analyses sensor readings from your PlantMate device - including
                                temperature, soil moisture, and light intensity - to predict how
                                healthy your plant is.
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Score types</Text>
                            <Text style={styles.sectionBody}>
                                There are two scores available - a <Text style={styles.bold}>2-day
                                rolling score</Text> which reflects recent conditions, and a{' '}
                                <Text style={styles.bold}>7-day rolling score</Text> which gives a
                                smoother long-term view of your plant's health.
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>When will my score appear?</Text>
                            <View style={styles.requirementBox}>
                                <Text style={styles.requirementIcon}><Timer size={18} color={'#2e7d32'}/></Text>
                                <Text style={styles.requirementText}>
                                    Your device needs at least{' '}
                                    <Text style={styles.bold}>408 hours of readings</Text> (about 17
                                    days) before the model can generate a reliable score.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => setVisible(false)}
                        >
                            <Text style={styles.doneButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Header button
    headerButton: {
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
    headerButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Modal
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f4f7f2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#f0f8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    iconEmoji: {
        fontSize: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a2e1a',
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    section: {
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2e7d32',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    sectionBody: {
        fontSize: 14,
        color: '#5a7a5a',
        lineHeight: 21,
    },
    bold: {
        fontWeight: '700',
        color: '#1a2e1a',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0ede0',
        marginVertical: 16,
    },
    requirementBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f8f0',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    requirementIcon: {
        fontSize: 18,
        marginTop: 1,
    },
    requirementText: {
        flex: 1,
        fontSize: 14,
        color: '#5a7a5a',
        lineHeight: 21,
    },
    doneButton: {
        backgroundColor: '#2e7d32',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    doneButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});