import React from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from "react-native";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Svg, { Polygon } from 'react-native-svg';

type Slide = {
    id: string;
    plant_info: string;
    fill_percnt: number;
}
const { width, height } = Dimensions.get('screen')

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



export default function MainPlantPage() {

    return (
        <View>
            <View style={styles.plantSelector}>
            </View>
            <View style={styles.plantTitle}>

                <View style={styles.plantName}>
                    <Text style={styles.plantNameText}>Plant Name</Text>
                </View>

                <Svg width={width * 0.1} height="100%" viewBox="0 0 30 60" style={{ marginLeft: -6, marginRight: -6 }}>

                    <Polygon
                        points="-6,-6 -6,66 36,-6"
                        fill="#0A8F2A"   // same as left side
                    />

                    <Polygon
                        points="36,-6 -6,66 36,66"
                        fill="#1EFF4A"   // same as right side
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
                                    backgroundColor="#3d5875"
                                    padding={width * 0.05}
                                >
                                    {fill => <Text >{fill}</Text>}

                                </AnimatedCircularProgress>

                            </View>
                        );
                    }}
                />
            </View>
            <View style={styles.infoViewer}>
                <Text>Hello</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    slide: {
        height: height / 3,
        width: width,
        alignItems: 'center'
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
    },
    infoViewer: {
        backgroundColor: "#9aaba445"
    },
    pagination: {
        position: 'absolute',
        bottom: 60,
        flexDirection: 'row',
        alignSelf: 'center',
    },
});
