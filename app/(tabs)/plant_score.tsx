import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChartColumn, SearchSlash, Sprout } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('screen');
const CHART_WIDTH = width - 32;
const API_BASE = 'https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com';

// Types

type Device = {
    device_id: string;
    plant_name: string;
    plant_type: string;
    location: string;
    plant_stage: string;
};

type ScoreReading = {
    plant_type: string;
    device_id: string;
    user_id: string;
    score_2d: string;
    score_7d: string;
    timestamp: number;
};

type ScoreKey = 'score_2d' | 'score_7d';

type TimePeriod = {
    label: string;
    limit: number;
    scoreKey: ScoreKey;
    xLabel: string;
};

// Constants

const TIME_PERIODS: TimePeriod[] = [
    { label: '24h', limit: 24, scoreKey: 'score_2d', xLabel: 'Last 24 Hours' },
    { label: '7d', limit: 168, scoreKey: 'score_7d', xLabel: 'Last 7 Days' },
    { label: '14d', limit: 336, scoreKey: 'score_7d', xLabel: 'Last 14 Days' },
];

// Helpers

function getScoreColor(score: number): string {
    if (score >= 9) return '#2e7d32';
    if (score >= 7) return '#4CAF50';
    if (score >= 5) return '#f9a825';
    if (score >= 3) return '#FF7043';
    return '#f44336';
}

function getScoreLabel(score: number): { label: string; sub: string } {
    if (score >= 9) return { label: 'Thriving', sub: 'Your plant is in peak condition' };
    if (score >= 7) return { label: 'Healthy', sub: 'Your plant is doing well' };
    if (score >= 5) return { label: 'Mild Stress', sub: 'Some improvements needed' };
    if (score >= 3) return { label: 'High Stress', sub: 'Your plant needs better care' };
    return { label: 'Critical Stress', sub: 'Plant will die soon without care' };
}

function buildChartLabels(readings: ScoreReading[]): string[] {
    const step = Math.max(1, Math.floor(readings.length / 6));
    return readings.map((_, i) => (i % step === 0 ? `${i + 1}` : ''));
}

function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Sub-components

function DeviceTopBar({
    devices,
    selectedIndex,
    onSelect,
}: {
    devices: Device[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}) {
    return (
        <View style={styles.topBarWrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topBarScroll}
            >
                {devices.map((device, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <TouchableOpacity
                            key={device.device_id}
                            style={[styles.tab, isSelected && styles.tabSelected]}
                            onPress={() => onSelect(index)}
                        >
                            <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                                {device.plant_name}
                            </Text>
                            {isSelected && <View style={styles.tabIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
    const animWidth = new Animated.Value(0);
    const barMaxWidth = width - 80;

    useEffect(() => {
        Animated.timing(animWidth, {
            toValue: (score / 10) * barMaxWidth,
            duration: 900,
            useNativeDriver: false,
        }).start();
    }, [score]);

    const { label, sub } = getScoreLabel(score);

    return (
        <View style={styles.gaugeContainer}>
            {/* Circle */}
            <View style={[styles.scoreCircleOuter, { borderColor: color + '30' }]}>
                <View style={[styles.scoreCircleInner, { borderColor: color }]}>
                    <Text style={[styles.scoreNumber, { color }]}>
                        {score.toFixed(1)}
                    </Text>
                    <Text style={styles.scoreOutOf}>/10</Text>
                </View>
            </View>

            {/* Label pill */}
            <View style={[styles.scoreLabelPill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                <Text style={[styles.scoreLabelText, { color }]}>{label}</Text>
            </View>

            {/* Sub label */}
            <Text style={styles.scoreSubLabel}>{sub}</Text>

            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
                <Animated.View
                    style={[styles.progressBarFill, { width: animWidth, backgroundColor: color }]}
                />
            </View>
            <View style={styles.progressBarLabels}>
                <Text style={styles.progressBarLabel}>0</Text>
                <Text style={styles.progressBarLabel}>Critical</Text>
                <Text style={styles.progressBarLabel}>Healthy</Text>
                <Text style={styles.progressBarLabel}>10</Text>
            </View>
        </View>
    );
}

function ScoreChart({
    readings,
    scoreKey,
    color,
    period,
}: {
    readings: ScoreReading[];
    scoreKey: ScoreKey;
    color: string;
    period: TimePeriod;
}) {
    if (readings.length < 2) {
        return (
            <View style={styles.emptyDataBox}>
                <Text style={styles.emptyDataIcon}><ChartColumn size={44} color={"#2e7d32"} /></Text>
                <Text style={styles.emptyDataTitle}>Not Enough Data</Text>
                <Text style={styles.emptyDataMessage}>
                    {period.limit === 24
                        ? 'Your plant needs at least a couple of score readings before hourly trends appear.'
                        : period.limit === 168
                            ? '7-day trends need at least a week of score history.'
                            : '14-day trends need at least 14 days of score history.'}
                </Text>
            </View>
        );
    }

    const scores = readings.map((r) => parseFloat(r[scoreKey]));
    const labels = buildChartLabels(readings);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = scores[scores.length - 1] - scores[0];
    const trendUp = trend >= 0;

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{period.xLabel}</Text>
                <View style={[styles.trendPill, { backgroundColor: trendUp ? '#e8f5e9' : '#fdecea' }]}>
                    <Text style={[styles.trendText, { color: trendUp ? '#2e7d32' : '#f44336' }]}>
                        {trendUp ? '↑' : '↓'} {Math.abs(trend).toFixed(2)} pts
                    </Text>
                </View>
            </View>

            <LineChart
                data={{
                    labels,
                    datasets: [
                        {
                            data: scores,
                            color: (opacity = 1) =>
                                color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                            strokeWidth: 2,
                        },
                        // Reference line at 7 (Healthy threshold)
                        {
                            data: scores.map(() => 7),
                            color: () => '#d4e9cc',
                            strokeWidth: 1,
                            withDots: false,
                        },
                    ],
                }}
                width={CHART_WIDTH - 32}
                height={180}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) =>
                        color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                    labelColor: () => '#8aaa8a',
                    style: { borderRadius: 12 },
                    propsForDots: {
                        r: '3',
                        strokeWidth: '2',
                        stroke: color,
                    },
                    propsForBackgroundLines: {
                        strokeDasharray: '4',
                        stroke: '#f0f4f0',
                        strokeWidth: 1,
                    },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withShadow={false}
                fromZero={false}
                yAxisSuffix=""
            />

            {/* Reference line label */}
            {/* <Text style={styles.referenceLineLabel}>
                - Dashed line marks the Healthy threshold (7.0)
            </Text> */}

            {/* Min / avg / max */}
            <View style={styles.statPills}>
                <View style={styles.statPill}>
                    <Text style={styles.statPillLabel}>MIN</Text>
                    <Text style={[styles.statPillValue, { color: getScoreColor(min) }]}>
                        {min.toFixed(2)}
                    </Text>
                    <Text style={styles.statPillSub}>{getScoreLabel(min).label}</Text>
                </View>
                <View style={[styles.statPill, styles.statPillCenter]}>
                    <Text style={styles.statPillLabel}>AVG</Text>
                    <Text style={[styles.statPillValue, { color: getScoreColor(avg) }]}>
                        {avg.toFixed(2)}
                    </Text>
                    <Text style={styles.statPillSub}>{getScoreLabel(avg).label}</Text>
                </View>
                <View style={styles.statPill}>
                    <Text style={styles.statPillLabel}>MAX</Text>
                    <Text style={[styles.statPillValue, { color: getScoreColor(max) }]}>
                        {max.toFixed(2)}
                    </Text>
                    <Text style={styles.statPillSub}>{getScoreLabel(max).label}</Text>
                </View>
            </View>
        </View>
    );
}

// Score key legend

function ScoreKeyLegend() {
    const items = [
        { range: '0 - 2', label: 'Critical Stress', color: '#f44336', emoji: '🆘' },
        { range: '3 - 4', label: 'High Stress', color: '#FF7043', emoji: '⚠️' },
        { range: '5 - 6', label: 'Mild Stress', color: '#f9a825', emoji: '🍂' },
        { range: '7 - 8', label: 'Healthy', color: '#4CAF50', emoji: '🌱' },
        { range: '9 - 10', label: 'Thriving', color: '#2e7d32', emoji: '🌿' },
    ];

    return (
        <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Score Guide</Text>
            {items.map((item) => (
                <View key={item.range} style={styles.legendRow}>
                    {/* <Text style={styles.legendEmoji}>{item.emoji}</Text> */}
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendRange}>{item.range}</Text>
                    <Text style={[styles.legendLabel, { color: item.color }]}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

// Main component

export default function PlantScorePage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [latestScores, setLatestScores] = useState<Record<string, ScoreReading>>({});
    const [scoreHistories, setScoreHistories] = useState<Record<string, Record<number, ScoreReading[]>>>({});
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
    const [loadingDevices, setLoadingDevices] = useState<boolean>(true);
    const [loadingScore, setLoadingScore] = useState<boolean>(false);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    const selectedPeriod = TIME_PERIODS[selectedPeriodIndex];

    // Fetch devices on mount
    useEffect(() => {
        const fetchDevices = async () => {
            setLoadingDevices(true);
            try {
                const idToken = await AsyncStorage.getItem('idToken');
                const res = await fetch(`${API_BASE}/users/devices`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                const data: Device[] = await res.json();
                setDevices(data);
            } catch (e) {
                console.error('Error fetching devices:', e);
            } finally {
                setLoadingDevices(false);
            }
        };
        fetchDevices();
    }, []);

    // Fetch latest score when device changes
    useEffect(() => {
        if (devices.length === 0) return;
        const device = devices[selectedIndex];
        if (!device) return;
        if (latestScores[device.device_id]) return;

        const fetchLatest = async () => {
            setLoadingScore(true);
            try {
                const idToken = await AsyncStorage.getItem('idToken');
                const res = await fetch(
                    `${API_BASE}/devices/${device.device_id}/scores/latest`,
                    { headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' } }
                );
                if (res.ok) {
                    const data: ScoreReading = await res.json();
                    setLatestScores((prev) => ({ ...prev, [device.device_id]: data }));
                }
            } catch (e) {
                console.error('Error fetching latest score:', e);
            } finally {
                setLoadingScore(false);
            }
        };

        fetchLatest();
    }, [selectedIndex, devices]);

    // Fetch score history when device or period changes
    useEffect(() => {
        if (devices.length === 0) return;
        const device = devices[selectedIndex];
        if (!device) return;
        if (scoreHistories[device.device_id]?.[selectedPeriod.limit]) return;

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const idToken = await AsyncStorage.getItem('idToken');
                const res = await fetch(
                    `${API_BASE}/devices/${device.device_id}/scores/history?limit=${selectedPeriod.limit}`,
                    { headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' } }
                );
                const data: ScoreReading[] = res.ok ? await res.json() : [];
                setScoreHistories((prev) => ({
                    ...prev,
                    [device.device_id]: {
                        ...prev[device.device_id],
                        [selectedPeriod.limit]: data ?? [],
                    },
                }));
            } catch (e) {
                console.error('Error fetching score history:', e);
                setScoreHistories((prev) => ({
                    ...prev,
                    [device.device_id]: {
                        ...prev[device.device_id],
                        [selectedPeriod.limit]: [],
                    },
                }));
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [selectedIndex, selectedPeriodIndex, devices]);

    const selectedDevice = devices[selectedIndex] ?? null;
    const latestScore = selectedDevice ? latestScores[selectedDevice.device_id] ?? null : null;
    const historyReadings = selectedDevice
        ? scoreHistories[selectedDevice.device_id]?.[selectedPeriod.limit] ?? null
        : null;

    // Use score_2d for 24h view, score_7d for 7d and 14d
    const currentScore = latestScore
        ? parseFloat(selectedPeriod.scoreKey === 'score_2d' ? latestScore.score_2d : latestScore.score_7d)
        : 0;
    const scoreColor = getScoreColor(currentScore);

    // Render 

    if (loadingDevices) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.loadingText}>Loading your plants...</Text>
            </View>
        );
    }

    if (devices.length === 0) {
        return (
            <View style={styles.emptyScreen}>
                <Text style={styles.emptyIconLarge}><Sprout size={64} color="#2e7d32" /></Text>
                <Text style={styles.emptyTitle}>No plants yet</Text>
                <Text style={styles.emptySubtitle}>
                    Add your first PlantMate device to see health scores here.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            <DeviceTopBar
                devices={devices}
                selectedIndex={selectedIndex}
                onSelect={(index) => setSelectedIndex(index)}
            />

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Page header */}
                <View style={styles.pageHeader}>
                    {/* <View style={styles.badge}>
                        <Text style={styles.badgeText}>Health Score</Text>
                    </View> */}
                    <Text style={styles.pageTitle}>
                        {selectedDevice?.plant_name ?? 'Plant'}
                    </Text>
                    <Text style={styles.pageSubtitle}>
                        {selectedDevice?.plant_type?.replace(/_/g, ' ')} · {selectedDevice?.location}
                    </Text>
                </View>

                {/* Period selector - shown at top to drive which score is shown */}
                <View style={styles.periodSelectorWrapper}>
                    <View style={styles.periodSelector}>
                        {TIME_PERIODS.map((period, index) => (
                            <TouchableOpacity
                                key={period.label}
                                style={[
                                    styles.periodButton,
                                    selectedPeriodIndex === index && styles.periodButtonSelected,
                                ]}
                                onPress={() => setSelectedPeriodIndex(index)}
                            >
                                <Text style={[
                                    styles.periodButtonText,
                                    selectedPeriodIndex === index && styles.periodButtonTextSelected,
                                ]}>
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.periodScoreNote}>
                        {selectedPeriod.scoreKey === 'score_2d'
                            ? 'Showing 2-day rolling score'
                            : 'Showing 7-day rolling score'}
                    </Text>
                </View>

                {/* Current score card */}
                <View style={styles.scoreCard}>
                    {loadingScore ? (
                        <View style={styles.scoreLoadingBox}>
                            <ActivityIndicator size="large" color="#2e7d32" />
                            <Text style={styles.loadingText}>Calculating score...</Text>
                        </View>
                    ) : latestScore ? (
                        <>
                            <Text style={styles.scoreCardTitle}>Current Score</Text>
                            <ScoreGauge score={currentScore} color={scoreColor} />
                            <Text style={styles.scoreTimestamp}>
                                Last updated · {formatTimestamp(latestScore.timestamp)}
                            </Text>
                        </>
                    ) : (
                        <View style={styles.scoreLoadingBox}>
                            <Text style={styles.emptyDataIcon}><SearchSlash size={44} color={'#2e7d32'} /></Text>
                            <Text style={styles.emptyDataTitle}>No Score Yet</Text>
                            <Text style={styles.emptyDataMessage}>
                                Your plant's health score will appear once the ML model has processed enough readings.
                            </Text>
                        </View>
                    )}
                </View>

                {/* History chart */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionLabel}>SCORE HISTORY</Text>

                    {loadingHistory ? (
                        <View style={styles.historyLoading}>
                            <ActivityIndicator size="small" color="#2e7d32" />
                            <Text style={styles.historyLoadingText}>Loading history...</Text>
                        </View>
                    ) : (
                        <ScoreChart
                            readings={historyReadings ?? []}
                            scoreKey={selectedPeriod.scoreKey}
                            color={scoreColor}
                            period={selectedPeriod}
                        />
                    )}
                </View>

                {/* Score key legend */}
                <View style={styles.legendSection}>
                    <Text style={styles.sectionLabel}>SCORE GUIDE</Text>
                    <ScoreKeyLegend />
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

// Styles

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f2',
    },

    // Loading / empty
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f7f2',
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
        color: '#5a7a5a',
        fontWeight: '500',
    },
    emptyScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f7f2',
        padding: 40,
    },
    emptyIconLarge: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a2e1a',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#5a7a5a',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Device top bar
    topBarWrapper: {
        backgroundColor: '#2e7d32',
        borderBottomWidth: 1,
        borderBottomColor: '#2e7d32',
        shadowColor: '#fff',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    topBarScroll: {
        paddingHorizontal: 12,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginRight: 4,
        alignItems: 'center',
        position: 'relative',
    },
    tabSelected: {},
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8aaa8a',
    },
    tabTextSelected: {
        color: '#fff',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 3,
        backgroundColor: '#fff',
        borderRadius: 2,
    },

    // Page header
    pageHeader: {
        padding: 24,
        paddingBottom: 12,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#c8e6c9',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2e7d32',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a2e1a',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#8aaa8a',
        fontWeight: '500',
        textTransform: 'capitalize',
    },

    // Period selector
    periodSelectorWrapper: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#e8f0e8',
        borderRadius: 12,
        padding: 4,
        marginBottom: 6,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 9,
    },
    periodButtonSelected: {
        backgroundColor: '#ffffff',
        shadowColor: '#2e7d32',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    periodButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8aaa8a',
    },
    periodButtonTextSelected: {
        color: '#2e7d32',
    },
    periodScoreNote: {
        fontSize: 11,
        color: '#8aaa8a',
        textAlign: 'center',
        fontWeight: '500',
    },

    // Score card
    scoreCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        marginBottom: 8,
    },
    scoreCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8aaa8a',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 20,
        textAlign: 'center',
    },
    scoreLoadingBox: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 12,
    },

    // Gauge
    gaugeContainer: {
        alignItems: 'center',
        gap: 14,
    },
    scoreCircleOuter: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreCircleInner: {
        width: 148,
        height: 148,
        borderRadius: 74,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    scoreEmoji: {
        fontSize: 30,
        marginBottom: 2,
    },
    scoreNumber: {
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: -2,
        lineHeight: 42,
    },
    scoreOutOf: {
        fontSize: 13,
        color: '#8aaa8a',
        fontWeight: '600',
    },
    scoreLabelPill: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 6,
    },
    scoreLabelText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    scoreSubLabel: {
        fontSize: 13,
        color: '#5a7a5a',
        fontWeight: '500',
        textAlign: 'center',
    },
    progressBarTrack: {
        width: width - 80,
        height: 8,
        backgroundColor: '#e8f0e8',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
    },
    progressBarLabels: {
        width: width - 80,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    progressBarLabel: {
        fontSize: 10,
        color: '#8aaa8a',
        fontWeight: '600',
    },
    scoreTimestamp: {
        fontSize: 12,
        color: '#8aaa8a',
        textAlign: 'center',
        marginTop: 8,
    },

    // History section
    historySection: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8aaa8a',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    historyLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 10,
    },
    historyLoadingText: {
        fontSize: 14,
        color: '#8aaa8a',
        fontWeight: '500',
    },

    // Chart
    chartCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a2e1a',
    },
    trendPill: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chart: {
        borderRadius: 10,
        marginLeft: -16,
    },
    referenceLineLabel: {
        fontSize: 11,
        color: '#8aaa8a',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 4,
        fontStyle: 'italic',
    },
    statPills: {
        flexDirection: 'row',
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f4f0',
        paddingTop: 12,
    },
    statPill: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statPillCenter: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#f0f4f0',
    },
    statPillLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8aaa8a',
        letterSpacing: 1,
    },
    statPillValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statPillSub: {
        fontSize: 10,
        color: '#8aaa8a',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Legend
    legendSection: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    legendCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        gap: 10,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a2e1a',
        marginBottom: 4,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    legendEmoji: {
        fontSize: 18,
        width: 24,
        textAlign: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendRange: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a2e1a',
        width: 50,
    },
    legendLabel: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Empty data
    emptyDataBox: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    emptyDataIcon: {
        fontSize: 44,
        marginBottom: 12,
    },
    emptyDataTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a2e1a',
        marginBottom: 8,
    },
    emptyDataMessage: {
        fontSize: 13,
        color: '#5a7a5a',
        textAlign: 'center',
        lineHeight: 20,
    },
});