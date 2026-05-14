import AsyncStorage from '@react-native-async-storage/async-storage';
import { Droplet, Sprout, SunMedium, Thermometer } from 'lucide-react-native';
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
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Pagination, usePagination } from '../components/pagination_component';

const { width, height } = Dimensions.get('screen');

const BASE_URL = 'https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com';

// Types

type Device = {
    device_id: string;
    plant_name: string;
    plant_type: string;
    location: string;
};

type Reading = {
    t_aht: number;
    soil_percent: number;
    lux: number;
    rh: number;
    p_hpa: number;
    t_bmp: number;
    soil_raw: number;
    timestamp: number;
};

type Slide = {
    id: string;
    plant_info: string;
    stat: number;
    optimal_stat: number;
    fill: number;
};

type PlantNotification = {
    id: string;
    notification_type: string;
    notification_info: string;
};

type OptimalStats = {
    temp: number;
    moisture: number;
    light: number;
};

// Optimal stats per plant type: Got from ML model 

const OPTIMAL_STATS: Record<string, OptimalStats> = {
    spider_plant: { temp: 21, moisture: 50, light: 400 },
    rose: { temp: 20, moisture: 60, light: 600 },
    cactus: { temp: 25, moisture: 20, light: 800 },
    aloe: { temp: 22, moisture: 30, light: 500 },
    pothos: { temp: 21, moisture: 50, light: 300 },
    peace_lily: { temp: 20, moisture: 60, light: 200 },
};

const DEFAULT_OPTIMAL: OptimalStats = { temp: 21, moisture: 50, light: 400 };

// Helpers

const Empty_Slides: Slide[] = [
    { id: '1', plant_info: 'moisture', stat: 0, optimal_stat: 0, fill: 0 },
    { id: '2', plant_info: 'temperature', stat: 0, optimal_stat: 0, fill: 0 },
    { id: '3', plant_info: 'light intensity', stat: 0, optimal_stat: 0, fill: 0 },
];

function buildSlides(reading: Reading, optimal: OptimalStats): Slide[] {
    return [
        {
            id: '1',
            plant_info: 'moisture',
            stat: reading.soil_percent ?? 0,
            optimal_stat: optimal.moisture,
            fill: Math.trunc(Math.max(0, 100 - Math.abs((reading.soil_percent ?? 0) - optimal.moisture))),
        },
        {
            id: '2',
            plant_info: 'temperature',
            stat: reading.t_aht ?? 0,
            optimal_stat: optimal.temp,
            fill: Math.trunc(Math.max(0, 100 - Math.abs((reading.t_aht ?? 0) - optimal.temp))),
        },
        {
            id: '3',
            plant_info: 'light intensity',
            stat: reading.lux ?? 0,
            optimal_stat: optimal.light,
            fill: Math.trunc(Math.max(0, 100 - Math.abs((reading.lux ?? 0) - optimal.light))),
        },
    ];
}

function getStatLabel(plant_info: string, stat: number): string {
    const value = stat ?? 0;
    if (plant_info === 'moisture')       return `${value}%`;
    if (plant_info === 'temperature')    return `${value.toFixed(1)}°C`;
    if (plant_info === 'light intensity') return `${value} lux`;
    return `${value}`;
}

function getOptimalLabel(plant_info: string, stat: number): string {
    if (plant_info === 'moisture') return `Optimal: ${stat}%`;
    if (plant_info === 'temperature') return `Optimal: ${stat}°C`;
    if (plant_info === 'light intensity') return `Optimal: ${stat} lux`;
    return `Optimal: ${stat}`;
}

function getFillColor(fill: number): string {
    if (fill >= 75) return '#4CAF50';
    if (fill >= 45) return '#f9a825';
    return '#f44336';
}

function getNotifications(slides: Slide[]): PlantNotification[] {
    const notifications: PlantNotification[] = [];

    slides.forEach((slide) => {
        if (slide.fill < 50) {
            if (slide.plant_info === 'moisture') {
                notifications.push({
                    id: slide.id,
                    notification_type: 'moisture',
                    notification_info:
                        slide.stat < slide.optimal_stat
                            ? 'Your plant needs watering'
                            : 'Your plant soil is too wet',
                });
            }
            if (slide.plant_info === 'temperature') {
                notifications.push({
                    id: slide.id,
                    notification_type: 'temperature',
                    notification_info:
                        slide.stat < slide.optimal_stat
                            ? 'Your plant is too cold'
                            : 'Your plant is too warm',
                });
            }
            if (slide.plant_info === 'light intensity') {
                notifications.push({
                    id: slide.id,
                    notification_type: 'light intensity',
                    notification_info:
                        slide.stat < slide.optimal_stat
                            ? 'Your plant needs more light'
                            : 'Your plant is getting too much light',
                });
            }
        }
    });

    if (notifications.length === 0) {
        notifications.push({
            id: '0',
            notification_type: 'ok',
            notification_info: 'Your plant is healthy! No issues detected.',
        });
    }

    return notifications;
}

// Device top bar

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

// Main component 

export default function MainPlantPage() {
    const plantPagination = usePagination();
    const notificationPagination = usePagination();

    const [devices, setDevices] = useState<Device[]>([]);
    const [readings, setReadings] = useState<Record<string, Reading>>({});
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const idToken = await AsyncStorage.getItem('idToken');

                // Fetch all devices
                const devicesRes = await fetch(`${BASE_URL}/users/devices`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                const devicesData: Device[] = await devicesRes.json();
                setDevices(devicesData);

                // Fetch latest reading for each device in parallel
                const readingResults = await Promise.all(
                    devicesData.map(async (device) => {
                        const res = await fetch(
                            `${BASE_URL}/devices/${device.device_id}/readings/latest`,
                            {
                                method: 'GET',
                                headers: { Authorization: `Bearer ${idToken}` },
                            }
                        );
                        const data: Reading = await res.json();
                        return { device_id: device.device_id, data };
                    })
                );

                const readingsMap: Record<string, Reading> = {};
                readingResults.forEach(({ device_id, data }) => {
                    readingsMap[device_id] = data;
                });
                setReadings(readingsMap);

            } catch (error) {
                console.error('Error fetching plant data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const selectedDevice = devices[selectedIndex] ?? null;
    const selectedReading = selectedDevice ? readings[selectedDevice.device_id] ?? null : null;
    const optimal = selectedDevice ? OPTIMAL_STATS[selectedDevice.plant_type] ?? DEFAULT_OPTIMAL : DEFAULT_OPTIMAL;
    const slides = selectedReading ? buildSlides(selectedReading, optimal) : Empty_Slides;
    const notifications = getNotifications(slides);

    // Loading screen
    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.loadingText}>Loading your plants...</Text>
            </View>
        );
    }

    // No devices screen
    if (devices.length === 0) {
        return (
            <View style={styles.emptyScreen}>
                <Text style={styles.emptyIcon}><Sprout size={64} color="#2e7d32" /></Text>
                <Text style={styles.emptyTitle}>No plants yet</Text>
                <Text style={styles.emptySubtitle}>
                    Add your first PlantMate device to get started.
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
                onSelect={(index) => {
                    setSelectedIndex(index);
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Top bar with diagonal cut */}
                {/* <View style={styles.plantTitle}>
                    <View style={styles.plantName}>
                        <Text style={styles.plantNameText}>
                            {selectedDevice?.plant_name ?? 'Plant Name'}
                        </Text>
                    </View>
                    <Svg
                        width={width * 0.1}
                        height="100%"
                        viewBox="0 0 30 60"
                        style={{ marginLeft: -6, marginRight: -6 }}
                    >
                        <Polygon points="-6,-6 -6,66 36,-6" fill="#2e7d32" />
                        <Polygon points="36,-6 -6,66 36,66" fill="#c8e6c9" />
                    </Svg>
                    <View style={styles.plantType}>
                        <Text style={styles.plantTypeText}>
                            {selectedDevice?.plant_type?.replace(/_/g, ' ') ?? 'Plant Type'}
                        </Text>
                    </View>
                </View> */}

                {/* Stat carousel */}
                <View style={styles.carouselSection}>
                    <Animated.FlatList
                        data={slides}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        onScroll={plantPagination.onScroll}
                        pagingEnabled
                        renderItem={({ item }) => {
                            const fillColor = getFillColor(item.fill);
                            return (
                                <View style={styles.slide}>
                                    <View style={styles.slideHeader}>
                                        <View style={[styles.slideIconCircle, { backgroundColor: fillColor + '22' }]}>
                                            {item.plant_info === 'moisture' && <Droplet size={20} color={fillColor} />}
                                            {item.plant_info === 'temperature' && <Thermometer size={20} color={fillColor} />}
                                            {item.plant_info === 'light intensity' && <SunMedium size={20} color={fillColor} />}
                                        </View>
                                        <Text style={styles.slideTitle}>
                                            {item.plant_info.charAt(0).toUpperCase() + item.plant_info.slice(1)}
                                        </Text>
                                    </View>

                                    <AnimatedCircularProgress
                                        style={{ marginTop: 8, marginBottom: height * -0.1 }}
                                        size={width * 0.8}
                                        width={32}
                                        arcSweepAngle={180}
                                        rotation={270}
                                        fill={item.fill}
                                        tintColor={fillColor}
                                        backgroundColor="#e0e0e0"
                                        lineCap="round"
                                        padding={width * 0.04}
                                    >
                                        {() => (
                                            <View style={styles.gaugeCenter}>
                                                {item.plant_info === 'moisture' && <Droplet size={36} color={fillColor} />}
                                                {item.plant_info === 'temperature' && <Thermometer size={36} color={fillColor} />}
                                                {item.plant_info === 'light intensity' && <SunMedium size={36} color={fillColor} />}
                                                <Text style={[styles.gaugeStat, { color: fillColor }]}>
                                                    {getStatLabel(item.plant_info, item.stat)}
                                                </Text>
                                                <Text style={styles.gaugeOptimal}>
                                                    {getOptimalLabel(item.plant_info, item.optimal_stat)}
                                                </Text>
                                            </View>
                                        )}
                                    </AnimatedCircularProgress>

                                    <View style={[styles.fillPill, { backgroundColor: fillColor + '18', borderColor: fillColor + '44' }]}>
                                        <Text style={[styles.fillPillText, { color: fillColor }]}>
                                            {item.fill}% match to optimal
                                        </Text>
                                    </View>

                                    <Pagination
                                        length={slides.length}
                                        currentIndex={plantPagination.index}
                                        paginationStyle={styles.pagination}
                                        paginationDot={styles.paginationDot}
                                        paginationDotSelected={styles.paginationDotSelected}
                                    />
                                </View>
                            );
                        }}
                    />

                </View>

                {/* Notifications */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>ALERTS</Text>
                </View>

                <Animated.FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={notificationPagination.onScroll}
                    pagingEnabled
                    renderItem={({ item }) => (
                        <View style={[
                            styles.notificationCard,
                            item.notification_type === 'ok' && styles.notificationCardOk,
                        ]}>
                            <View style={styles.notificationTop}>
                                <View style={[
                                    styles.notificationIconCircle,
                                    item.notification_type === 'ok' && styles.notificationIconCircleOk,
                                ]}>
                                    {item.notification_type === 'moisture' && <Droplet size={22} color="#f44336" />}
                                    {item.notification_type === 'temperature' && <Thermometer size={22} color="#f44336" />}
                                    {item.notification_type === 'light intensity' && <SunMedium size={22} color="#f44336" />}
                                    {item.notification_type === 'ok' && <Text style={{ fontSize: 20 }}>✓</Text>}
                                </View>
                                <Text style={styles.notificationType}>
                                    {item.notification_type === 'ok'
                                        ? 'All Good'
                                        : item.notification_type.charAt(0).toUpperCase() + item.notification_type.slice(1)}
                                </Text>
                            </View>
                            <Text style={styles.notificationInfo}>{item.notification_info}</Text>
                            {notifications.length > 1 && (
                                <Pagination
                                    length={notifications.length}
                                    currentIndex={notificationPagination.index}
                                    paginationStyle={styles.notificationPagination}
                                    paginationDot={styles.notificationPaginationDot}
                                    paginationDotSelected={styles.notificationPaginationDotSelected}
                                />
                            )}
                        </View>
                    )}
                />

                {/* Plant info grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>PLANT INFO</Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardLabel}>Location</Text>
                        <Text style={styles.infoCardValue}>
                            {selectedDevice?.location ?? '-'}
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardLabel}>Plant Type</Text>
                        <Text style={styles.infoCardValue}>
                            {selectedDevice?.plant_type?.replace(/_/g, ' ') ?? 'Plant Type'}
                        </Text>
                    </View>
                    {/* <View style={styles.infoCard}>
                        <Text style={styles.infoCardLabel}>Pressure</Text>
                        <Text style={styles.infoCardValue}>
                            {selectedReading ? `${selectedReading.p_hpa.toFixed(1)} hPa` : '-'}
                        </Text>
                    </View> */}
                    <View style={[styles.infoCard, styles.infoCardFull]}>
                        <Text style={styles.infoCardLabel}>Device ID</Text>
                        <Text style={styles.infoCardValue} numberOfLines={1}>
                            {selectedDevice?.device_id ?? '-'}
                        </Text>
                    </View>
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

    // Top bar diagonal
    plantTitle: {
        flexDirection: 'row',
        height: 52,
        overflow: 'hidden',
    },
    plantName: {
        flex: 1,
        backgroundColor: '#2e7d32',
        justifyContent: 'center',
        paddingLeft: 16,
    },
    plantNameText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    plantType: {
        width: width * 0.32,
        backgroundColor: '#c8e6c9',
        justifyContent: 'center',
        paddingRight: 14,
        alignItems: 'flex-end',
    },
    plantTypeText: {
        color: '#1a2e1a',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },

    // Carousel
    carouselSection: {
        backgroundColor: '#ffffff',
        paddingTop: 16,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    slide: {
        width: width,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 0,
    },
    slideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    slideIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slideTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2e1a',
        letterSpacing: 0.2,
    },
    gaugeCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    gaugeStat: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginTop: 4,
    },
    gaugeOptimal: {
        fontSize: 12,
        color: '#8aaa8a',
        fontWeight: '500',
    },
    fillPill: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginTop: 4,
        marginBottom: 8,
    },
    fillPillText: {
        fontSize: 13,
        fontWeight: '600',
    },
    pagination: {
        width,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#ffffff',
    },
    paginationDot: {
        borderRadius: 10,
        width: 8,
        height: 8,
        margin: 5,
        backgroundColor: '#d4e9cc',
    },
    paginationDotSelected: {
        backgroundColor: '#2e7d32',
    },

    // Section headers
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 10,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8aaa8a',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },

    // Notifications
    notificationCard: {
        width: width - 40,
        marginLeft: 20,
        marginRight: 20,
        backgroundColor: '#2e7d32',
        borderRadius: 16,
        padding: 18,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
    },
    notificationCardOk: {
        borderLeftColor: '#4CAF50',
    },
    notificationTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    notificationIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#fdecea',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIconCircleOk: {
        backgroundColor: '#f0f8f0',
    },
    notificationType: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },
    notificationInfo: {
        fontSize: 15,
        color: '#fff',
        lineHeight: 21,
        marginBottom: 8,
    },
    notificationPagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 4,
    },
    notificationPaginationDot: {
        borderRadius: 6,
        width: 6,
        height: 6,
        margin: 4,
        backgroundColor: '#d4e9cc',
    },
    notificationPaginationDotSelected: {
        backgroundColor: '#fff',
    },

    // Info grid
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 10,
    },
    infoCard: {
        width: (width - 52) / 2,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#2e7d32',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    infoCardFull: {
        width: width - 32,
    },
    infoCardLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8aaa8a',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    infoCardValue: {
        textTransform: 'capitalize',
        fontSize: 16,
        fontWeight: '700',
        color: '#1a2e1a',
    },
});