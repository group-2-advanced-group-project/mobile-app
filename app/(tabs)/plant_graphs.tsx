import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChartColumn, Droplet, Sprout, SunMedium, Thermometer } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('screen');

const BASE_URL = 'https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com';
const CHART_WIDTH = width - 32;

// Types

type Device = {
    device_id: string;
    plant_name: string;
    plant_type: string;
    location: string;
    plant_stage: string;
};

type HistoryReading = {
    device_id: string;
    user_id: string;
    lux: string;
    t_aht: string;
    soil_percent: string;
    timestamp: number;
};

type TimeRange = 'hourly' | 'daily' | 'weekly';

type StatKey = 'moisture' | 'temperature' | 'light';

// Helpers

function aggregateReadings(readings: HistoryReading[], range: TimeRange) {
    if (range === 'hourly') {
        // Return last 24 readings (24 hours)
        const slice = readings.slice(-24);
        return {
            labels: slice.map((_, i) =>
                i % 6 === 0 ? `${i}h` : ''
            ),
            data: slice,
        };
    }

    if (range === 'daily') {
        // Group into 24-reading buckets (1 day each) - up to 17 days
        const days: HistoryReading[][] = [];
        for (let i = 0; i < readings.length; i += 24) {
            days.push(readings.slice(i, i + 24));
        }
        const averaged = days.map((day) => {
            const avg = (key: keyof HistoryReading) =>
                day.reduce((sum, r) => sum + parseFloat(r[key] as string), 0) / day.length;
            return {
                device_id: day[0].device_id,
                user_id: day[0].user_id,
                lux: avg('lux').toFixed(2),
                t_aht: avg('t_aht').toFixed(2),
                soil_percent: avg('soil_percent').toFixed(2),
                timestamp: day[0].timestamp,
            } as HistoryReading;
        });
        return {
            labels: averaged.map((_, i) => `${i + 1}`),
            data: averaged,
        };
    }

    // Weekly - group into 168-reading buckets (1 week each)
    const weeks: HistoryReading[][] = [];
    for (let i = 0; i < readings.length; i += 168) {
        weeks.push(readings.slice(i, i + 168));
    }
    const averaged = weeks.map((week) => {
        const avg = (key: keyof HistoryReading) =>
            week.reduce((sum, r) => sum + parseFloat(r[key] as string), 0) / week.length;
        return {
            device_id: week[0].device_id,
            user_id: week[0].user_id,
            lux: avg('lux').toFixed(2),
            t_aht: avg('t_aht').toFixed(2),
            soil_percent: avg('soil_percent').toFixed(2),
            timestamp: week[0].timestamp,
        } as HistoryReading;
    });
    return {
        labels: averaged.map((_, i) => `W${i + 1}`),
        data: averaged,
    };
}

function getMinDataRequired(range: TimeRange): number {
    if (range === 'hourly') return 2;
    if (range === 'daily') return 24;
    return 168;
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

function TimeRangeSelector({
    selected,
    onSelect,
}: {
    selected: TimeRange;
    onSelect: (range: TimeRange) => void;
}) {
    const options: { label: string; value: TimeRange }[] = [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
    ];

    return (
        <View style={styles.rangeSelector}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    style={[
                        styles.rangeButton,
                        selected === option.value && styles.rangeButtonSelected,
                    ]}
                    onPress={() => onSelect(option.value)}
                >
                    <Text
                        style={[
                            styles.rangeButtonText,
                            selected === option.value && styles.rangeButtonTextSelected,
                        ]}
                    >
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function StatChart({
    label,
    icon,
    color,
    data,
    labels,
    unit,
    // currentValue,
}: {
    label: string;
    icon: React.ReactNode;
    color: string;
    data: number[];
    labels: string[];
    unit: string;
    // currentValue: number;
}) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    return (
        <View style={styles.chartCard}>
            {/* Chart header */}
            <View style={styles.chartHeader}>
                <View style={styles.chartHeaderLeft}>
                    <View style={[styles.chartIconCircle, { backgroundColor: color + '20' }]}>
                        {icon}
                    </View>
                    <View>
                        <Text style={styles.chartLabel}>{label}</Text>
                        {/* <Text style={[styles.chartCurrentValue, { color }]}>
                            {currentValue.toFixed(1)}{unit}
                        </Text> */}
                    </View>
                </View>
            </View>

            {/* Line chart */}
            <LineChart
                data={{
                    labels,
                    datasets: [{ data }],
                }}
                width={CHART_WIDTH - 32}
                height={160}
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
                        stroke: '#e0ede0',
                        strokeWidth: 1,
                    },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLabels={true}
                withHorizontalLabels={true}
            />

            {/* Min / avg / max pills */}
            <View style={styles.statPills}>
                <View style={styles.statPill}>
                    <Text style={styles.statPillLabel}>MIN</Text>
                    <Text style={[styles.statPillValue, { color }]}>{min.toFixed(1)}{unit}</Text>
                </View>
                <View style={[styles.statPill, styles.statPillCenter]}>
                    <Text style={styles.statPillLabel}>AVG</Text>
                    <Text style={[styles.statPillValue, { color }]}>{avg.toFixed(1)}{unit}</Text>
                </View>
                <View style={styles.statPill}>
                    <Text style={styles.statPillLabel}>MAX</Text>
                    <Text style={[styles.statPillValue, { color }]}>{max.toFixed(1)}{unit}</Text>
                </View>
            </View>
        </View>
    );
}

function NotEnoughData({ range }: { range: TimeRange }) {
    const messages: Record<TimeRange, string> = {
        hourly: 'Not enough data yet. Your device needs at least a couple of readings before hourly trends appear.',
        daily: 'Not enough data yet. Daily trends need at least 24 hours of readings.',
        weekly: 'Not enough data yet. Weekly trends need at least 7 days of readings.',
    };

    return (
        <View style={styles.emptyDataBox}>
            <Text style={styles.emptyDataIcon}><ChartColumn size={48} color={'#2e7d32'}/></Text>
            <Text style={styles.emptyDataTitle}>Not Enough Data</Text>
            <Text style={styles.emptyDataMessage}>{messages[range]}</Text>
        </View>
    );
}

// Main component

export default function PlantDataPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [history, setHistory] = useState<Record<string, HistoryReading[]>>({});
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [timeRange, setTimeRange] = useState<TimeRange>('hourly');
    const [loadingDevices, setLoadingDevices] = useState<boolean>(true);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // Fetch devices on mount
    useEffect(() => {
        const fetchDevices = async () => {
            setLoadingDevices(true);
            try {
                const idToken = await AsyncStorage.getItem('idToken');
                const res = await fetch(`${BASE_URL}/users/devices`, {
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

    // Fetch history when selected device changes
    useEffect(() => {
        if (devices.length === 0) return;

        const device = devices[selectedIndex];
        if (!device) return;

        // Already cached
        if (history[device.device_id]) return;

        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const idToken = await AsyncStorage.getItem('idToken');
                const res = await fetch(
                    `${BASE_URL}/devices/${device.device_id}/readings/history`,
                    {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${idToken}` },
                    }
                );

                if (!res.ok) {
                    setHistory((prev) => ({ ...prev, [device.device_id]: [] }));
                    return;
                }

                const data: HistoryReading[] = await res.json();
                setHistory((prev) => ({ ...prev, [device.device_id]: data ?? [] }));
            } catch (e) {
                console.error('Error fetching history:', e);
                setHistory((prev) => ({ ...prev, [device.device_id]: [] }));
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [selectedIndex, devices]);

    const selectedDevice = devices[selectedIndex] ?? null;
    const rawReadings = selectedDevice ? history[selectedDevice.device_id] ?? null : null;
    const minRequired = getMinDataRequired(timeRange);
    const hasEnoughData = rawReadings !== null && rawReadings.length >= minRequired;

    const aggregated = hasEnoughData ? aggregateReadings(rawReadings, timeRange) : null;

    const moistureData = aggregated?.data.map((r) => parseFloat(r.soil_percent)) ?? [];
    const tempData     = aggregated?.data.map((r) => parseFloat(r.t_aht))        ?? [];
    const lightData    = aggregated?.data.map((r) => parseFloat(r.lux))          ?? [];
    const chartLabels  = aggregated?.labels ?? [];

    const latestReading = rawReadings && rawReadings.length > 0
        ? rawReadings[rawReadings.length - 1]
        : null;

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
                <Text style={styles.emptyIcon}><Sprout size={64} color="#2e7d32" /></Text>
                <Text style={styles.emptyTitle}>No plants yet</Text>
                <Text style={styles.emptySubtitle}>
                    Add your first PlantMate device to see data here.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Device tab selector */}
            <DeviceTopBar
                devices={devices}
                selectedIndex={selectedIndex}
                onSelect={(index) => setSelectedIndex(index)}
            />

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Page header */}
                <View style={styles.pageHeader}>
                    {/* <View style={styles.badge}>
                        <Text style={styles.badgeText}>Analytics</Text>
                    </View> */}
                    <Text style={styles.pageTitle}>
                        {selectedDevice?.plant_name ?? 'Plant'} Data
                    </Text>
                    <Text style={styles.pageSubtitle}>
                        {selectedDevice?.plant_type?.replace(/_/g, ' ')} · {selectedDevice?.location}
                    </Text>
                </View>

                {/* Time range selector */}
                <View style={styles.rangeSelectorWrapper}>
                    <TimeRangeSelector
                        selected={timeRange}
                        onSelect={setTimeRange}
                    />
                </View>

                {/* Loading history */}
                {loadingHistory && (
                    <View style={styles.historyLoading}>
                        <ActivityIndicator size="small" color="#2e7d32" />
                        <Text style={styles.historyLoadingText}>Fetching readings...</Text>
                    </View>
                )}

                {/* Not enough data */}
                {!loadingHistory && !hasEnoughData && (
                    <NotEnoughData range={timeRange} />
                )}

                {/* Charts */}
                {!loadingHistory && hasEnoughData && aggregated && (
                    <View style={styles.charts}>
                        <StatChart
                            label="Moisture"
                            icon={<Droplet size={18} color="#2196F3" />}
                            color="#2196F3"
                            data={moistureData}
                            labels={chartLabels}
                            unit="%"
                            // currentValue={latestReading ? parseFloat(latestReading.soil_percent) : 0}
                        />
                        <StatChart
                            label="Temperature"
                            icon={<Thermometer size={18} color="#f9a825" />}
                            color="#f9a825"
                            data={tempData}
                            labels={chartLabels}
                            unit="°C"
                            // currentValue={latestReading ? parseFloat(latestReading.t_aht) : 0}
                        />
                        <StatChart
                            label="Light Intensity"
                            icon={<SunMedium size={18} color="#4CAF50" />}
                            color="#4CAF50"
                            data={lightData}
                            labels={chartLabels}
                            unit=" lux"
                            // currentValue={latestReading ? parseFloat(latestReading.lux) : 0}
                        />
                    </View>
                )}

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
    emptyIcon: {
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

    // Time range selector
    rangeSelectorWrapper: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    rangeSelector: {
        flexDirection: 'row',
        backgroundColor: '#e8f0e8',
        borderRadius: 12,
        padding: 4,
    },
    rangeButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 9,
    },
    rangeButtonSelected: {
        backgroundColor: '#ffffff',
        shadowColor: '#2e7d32',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    rangeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8aaa8a',
    },
    rangeButtonTextSelected: {
        color: '#2e7d32',
    },

    // History loading
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

    // Not enough data
    emptyDataBox: {
        margin: 16,
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
        fontSize: 48,
        marginBottom: 14,
    },
    emptyDataTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a2e1a',
        marginBottom: 8,
    },
    emptyDataMessage: {
        fontSize: 14,
        color: '#5a7a5a',
        textAlign: 'center',
        lineHeight: 21,
    },

    // Charts
    charts: {
        paddingHorizontal: 16,
        gap: 16,
        paddingTop: 8,
    },
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
    chartHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chartIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a2e1a',
        marginBottom: 1,
    },
    chartCurrentValue: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    chart: {
        borderRadius: 10,
        marginLeft: -16,
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
        marginBottom: 3,
    },
    statPillValue: {
        fontSize: 15,
        fontWeight: '700',
    },
});