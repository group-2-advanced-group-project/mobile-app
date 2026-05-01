import AsyncStorage from '@react-native-async-storage/async-storage';
import { Droplet, SunMedium, Thermometer } from 'lucide-react-native';
import { useEffect, useState, } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Svg, { Polygon } from 'react-native-svg';
import { Pagination, usePagination } from '../components/pagination_component';
const { width, height } = Dimensions.get('screen')

type Slide = {
    id: string;
    plant_info: string;
    stat: number;
    optimal_stat: number;
    fill: number;
}

type PlantNotification = {
    id: string;
    notification_type: string;
    notification_info: string;
}

const NOTIFICATIONS: PlantNotification[] = [
    {
        id: "1",
        notification_type: 'moisture',
        notification_info: 'You need to water your plant'
    },
    {
        id: "2",
        notification_type: 'temperature',
        notification_info: 'Your plant is too cold'
    },
    {
        id: "3",
        notification_type: 'light intensity',
        notification_info: 'Your plant needs light'
    },
]

type Stats = {
    plant: string;
    temp: number;
    moisture: number;
    light: number;
}

const SPIDER_PLANT_OPTIMAL: Stats = {
    plant: "Spider Plant",
    temp: 21,
    moisture: 50,
    light: 400
}

const Empty_Slides: Slide[] = [
    {
        id: "1",
        plant_info: 'moisture',
        stat: 0,
        optimal_stat: 0,
        fill: 0
    },
    {
        id: "2",
        plant_info: 'temperature',
        stat: 0,
        optimal_stat: 0,
        fill: 0
    },
    {
        id: "3",
        plant_info: 'light intensity',
        stat: 0,
        optimal_stat: 0,
        fill: 0
    },
];




export default function MainPlantPage() {

    const plantPagination = usePagination();
    const notificationPagination = usePagination();


    // Add these
    const [devices, setDevices] = useState<Stats>();
    const [readings, setReadings] = useState<Stats>();
    const [slides, setSlides] = useState<Slide[]>(Empty_Slides);

    useEffect(() => {
        const fetchData = async () => {
            const idToken = await AsyncStorage.getItem("idToken");

            const devicesRes = await fetch("https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com/users/devices", {
                method: "GET",

                headers: { "Authorization": `Bearer ${idToken}` }
            });
            const devicesData = await devicesRes.json();
            setDevices(devicesData);

            const readingsPromises = devicesData.map(device =>
                fetch(`https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com/devices/${device.device_id}/readings/latest`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${idToken}` }
                }).then(res => res.json())
            );

            const plantReadingsRes = await fetch("https://bnxw6o1jua.execute-api.eu-west-2.amazonaws.com/devices/PLANT_MATE_TEST_001/readings/history", {
                method: "GET",
                headers: { "Authorization": `Bearer ${idToken}` }
            });
            const plantReadings = await plantReadingsRes.json();

            const readingsData = await Promise.all(readingsPromises);
            // setReadings(readingsData);
            console.log(devicesData)
            console.log(readingsData)
            console.log(readingsData[0].lux, readingsData[0].t_aht, readingsData[0].soil_percent)
            var latestReadingsData: Stats = {
                plant: "Spider Plant",
                temp: readingsData[0].t_aht,
                moisture: readingsData[0].soil_percent,
                light: readingsData[0].lux
            }
            console.log(latestReadingsData)
            setReadings(latestReadingsData)
            console.log(SPIDER_PLANT_OPTIMAL)

            const SLIDES: Slide[] = [
                {
                    id: "1",
                    plant_info: 'moisture',
                    stat: readingsData[0].soil_percent,
                    optimal_stat: SPIDER_PLANT_OPTIMAL.moisture,
                    fill: Math.trunc(Math.max(0, 100 - (Math.abs(readingsData[0].soil_percent - SPIDER_PLANT_OPTIMAL.moisture))))
                },
                {
                    id: "2",
                    plant_info: 'temperature',
                    stat: readingsData[0].t_aht,
                    optimal_stat: SPIDER_PLANT_OPTIMAL.temp,
                    fill: Math.trunc(Math.max(0, 100 - (Math.abs(readingsData[0].t_aht - SPIDER_PLANT_OPTIMAL.temp))))

                },
                {
                    id: "3",
                    plant_info: 'light intensity',
                    stat: readingsData[0].lux,
                    optimal_stat: SPIDER_PLANT_OPTIMAL.light,
                    fill: Math.trunc(Math.max(0, 100 - (Math.abs(readingsData[0].lux - SPIDER_PLANT_OPTIMAL.light))))
                },
            ];

            setSlides(SLIDES)
            console.log(idToken)
            console.log(SLIDES[2].stat, SLIDES[2].optimal_stat)
            console.log(Math.trunc(Math.max(0, 100 - (Math.abs(SLIDES[1].stat - SLIDES[1].optimal_stat) / SLIDES[1].optimal_stat * 100))));
        };

        fetchData();
    }, []);

    return (
        <View>
            <View style={styles.plantTitle}>

                <View style={styles.plantName}>
                    <Text style={styles.plantNameText}>Plant Name</Text>
                </View>

                <Svg width={width * 0.1} height="100%" viewBox="0 0 30 60" style={{ marginLeft: -6, marginRight: -6 }}>

                    <Polygon
                        points="-6,-6 -6,66 36,-6"
                        fill="#038b10"
                    />

                    <Polygon
                        points="36,-6 -6,66 36,66"
                        fill="#00ff44"
                    />
                </Svg>

                <View style={styles.plantType}>
                    <Text style={styles.plantTypeText}>Plant Type</Text>
                </View>

            </View>
            <View>
                <Animated.FlatList
                    data={slides}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={plantPagination.onScroll}
                    pagingEnabled
                    renderItem={({ item }) => {
                        // console.log(item);
                        return (
                            <View style={styles.slide}>

                                <Text>{item.plant_info}</Text>

                                <AnimatedCircularProgress
                                    style={{ marginTop: width * 0.1 }}
                                    size={width * 0.95}
                                    width={50}
                                    arcSweepAngle={180}
                                    rotation={270}
                                    fill={item.fill}
                                    // fill={Math.trunc(Math.max(0, 100 - (Math.abs(item.stat - item.optimal_stat) / item.optimal_stat * 100)))}
                                    tintColor="#45b65f"
                                    backgroundColor="#63716d"
                                    padding={width * 0.05}
                                >
                                    {fill =>

                                        <View>
                                            {item.plant_info === 'moisture' && <Droplet size={64} />}
                                            {item.plant_info === 'temperature' && <Thermometer size={64} />}
                                            {item.plant_info === 'light intensity' && <SunMedium size={64} />}
                                            {/* {item.plant_info === 'humidity' && <Droplets size={64} />} */}

                                            {/* <Text >{fill}</Text> */}
                                        </View>

                                    }

                                </AnimatedCircularProgress>

                            </View>
                        );
                    }}
                />
                <Pagination
                    length={slides.length}
                    currentIndex={plantPagination.index}
                    paginationStyle={styles.pagination}
                    paginationDot={styles.paginationDot}
                    paginationDotSelected={styles.paginationDotSelected}

                />
            </View>
            {/* BELOW HERE A VERTICAL SCROLLABLE COULD BE IMPLEMENTED */}
            <Animated.FlatList
                data={NOTIFICATIONS}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={notificationPagination.onScroll}
                pagingEnabled
                renderItem={({ item }) => {
                    return (
                        <View style={styles.plantInfoNotification}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                                {/* <Droplet color="#fff" /> */}
                                {item.notification_type === 'moisture' && <Droplet size={30} color="#fff" />}
                                {item.notification_type === 'temperature' && <Thermometer size={30} color="#fff" />}
                                {item.notification_type === 'light intensity' && <SunMedium size={30} color="#fff" />}
                                {/* {item.notification_type === 'humidity' && <Droplets size={30} color="#fff" />} */}
                                <Text style={styles.plantInfoNotificationText}>
                                    {item.notification_info}
                                </Text>
                            </View>
                            <Pagination
                                length={NOTIFICATIONS.length}
                                currentIndex={notificationPagination.index}
                                paginationStyle={styles.notificationPagination}
                                paginationDot={styles.notificationPaginationDot}
                                paginationDotSelected={styles.notificationPaginationDotSelected}
                            />
                        </View>
                    );

                }}
            />
            <View style={styles.plantGeneralInfo}>
                <Text>Last Water</Text>
                <Text></Text>
            </View>
            <View style={styles.plantGeneralInfo}>
                <Text>Plant Lifespan</Text>
                <Text>Other Plant Info</Text>
                <Text>Other Plant Info</Text>
            </View>
            <View style={styles.plantSelector}>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    slide: {
        height: height * 0.35,
        width: width,
        alignItems: 'center',
        backgroundColor: '#ebebeb',
        // marginBottom: height * 0.025,
    },
    pagination: {
        width,
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: height * 0.02,
        backgroundColor: '#ebebeb'
    },
    paginationDot: {
        borderRadius: 10,
        width: 10,
        height: 10,
        margin: 7,
        backgroundColor: '#bfbdbd',
    },
    paginationDotSelected: {
        backgroundColor: '#ffffff'
    },
    notificationPagination: {
        paddingTop: height * 0.01,
        width: width * 0.8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    notificationPaginationDot: {
        borderRadius: 6,
        width: 6,
        height: 6,
        margin: 5,
        marginBottom: 0,
        backgroundColor: '#376821',
    },
    notificationPaginationDotSelected: {
        backgroundColor: '#ffffff'
    },
    plantTitle: {
        flexDirection: 'row',
        height: 45,
        borderBottomWidth: 1,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: 'transparent',
        // paddingHorizontal: 12,
    },
    plantName: {
        flex: 1,
        backgroundColor: '#038b10',
        justifyContent: 'center',
        paddingLeft: 12,
        // textAlign: 'left',
    },
    plantType: {
        width: width * 0.3,
        backgroundColor: '#00ff44',
        justifyContent: 'center',
        paddingRight: 12,
        alignItems: 'flex-end'
        // textAlign: 'right',
    },
    svg: {
        height: "100%",
    },
    plantNameText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    plantTypeText: {
        color: '#010101',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    plantSelector: {
        backgroundColor: "#3d5243",
        padding: 20,
        outlineColor: '#3d5243',
        margin: 0,
    },
    plantInfoNotification: {
        width: width * 0.9,
        padding: width * 0.05,
        marginLeft: width * 0.05,
        marginRight: width * 0.05,
        marginBottom: width * 0.05,
        backgroundColor: '#038b10',
        borderRadius: 15,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowRadius: 5,
        shadowOpacity: 0.4,
        elevation: 5
    },
    plantInfoNotificationText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 500,
        textAlign: 'center',
        justifyContent: 'center'

    },
    plantGeneralInfo: {
        flexDirection: 'row',
        backgroundColor: "#9aaba445",
        padding: width * 0.05,
        marginLeft: width * 0.05,
        marginRight: width * 0.05,
        marginBottom: width * 0.05,
    },
});
