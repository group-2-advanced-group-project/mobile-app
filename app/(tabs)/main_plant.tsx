import { Droplet, Droplets, SunMedium, Thermometer } from 'lucide-react-native';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from "react-native";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Svg, { Polygon } from 'react-native-svg';
import { Pagination, usePagination } from '../components/pagination_component';

const { width, height } = Dimensions.get('screen')

type Slide = {
    id: string;
    plant_info: string;
    fill_percnt: number;
}

const SLIDES: Slide[] = [
    {
        id: "1",
        plant_info: 'water',
        fill_percnt: 33
    },
    {
        id: "2",
        plant_info: 'temperature',
        fill_percnt: 50
    },
    {
        id: "3",
        plant_info: 'light intensity',
        fill_percnt: 75
    },
    {
        id: "4",
        plant_info: 'humidity',
        fill_percnt: 100
    },
];

type PlantNotification = {
    id: string;
    notification_type: string;
    notification_info: string;
}

const NOTIFICATIONS: PlantNotification[] = [
    {
        id: "1",
        notification_type: 'water',
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
    {
        id: "4",
        notification_type: 'humidity',
        notification_info: 'You need to water your plant'
    },
]



export default function MainPlantPage() {

    const plantPagination = usePagination();
    const notificationPagination = usePagination();

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
                    data={SLIDES}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={plantPagination.onScroll}
                    pagingEnabled
                    renderItem={({ item }) => {
                        return (
                            <View style={styles.slide}>

                                <Text>{item.plant_info}</Text>

                                <AnimatedCircularProgress
                                    style={{ marginTop: width * 0.1 }}
                                    size={width * 0.95}
                                    width={50}
                                    arcSweepAngle={180}
                                    rotation={270}
                                    fill={item.fill_percnt}
                                    tintColor="#45b65f"
                                    backgroundColor="#63716d"
                                    padding={width * 0.05}
                                >
                                    {fill =>

                                        <View>
                                            {item.plant_info === 'water' && <Droplet size={64} />}
                                            {item.plant_info === 'temperature' && <Thermometer size={64} />}
                                            {item.plant_info === 'light intensity' && <SunMedium size={64} />}
                                            {item.plant_info === 'humidity' && <Droplets size={64} />}

                                            {/* <Text >{fill}</Text> */}
                                        </View>

                                    }

                                </AnimatedCircularProgress>

                            </View>
                        );
                    }}
                />
                <Pagination
                    length={SLIDES.length}
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
                            <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
                                {/* <Droplet color="#fff" /> */}
                                {item.notification_type === 'water' &&  <Droplet size={30} color="#fff"/>}
                                {item.notification_type === 'temperature' && <Thermometer size={30} color="#fff"/>}
                                {item.notification_type === 'light intensity' && <SunMedium size={30} color="#fff"/>}
                                {item.notification_type === 'humidity' && <Droplets size={30} color="#fff"/>}
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
