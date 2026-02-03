import React from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from "react-native";
import { AnimatedCircularProgress } from 'react-native-circular-progress';

type Slide = {
    id: string;
    plant_name: string;
    plant_type: string;
    fill_percnt: number;
}
const { width, height } = Dimensions.get('screen')

const SLIDES: Slide[] = [
    {
        id: "1",
        plant_name: "Page 1",
        plant_type: "Sunflower",
        fill_percnt: 33
    },
    {
        id: "2",
        plant_name: "Page 2",
        plant_type: "Sunflower",
        fill_percnt: 50
    },
    {
        id: "3",
        plant_name: "hi",
        plant_type: "Sunflower",
        fill_percnt: 75
    },
    {
        id: "4",
        plant_name: "Page 4",
        plant_type: "Sunflower",
        fill_percnt: 100
    },
];



export default function MainPlantPage() {

    return (
        <View style={styles.container}>
            <View style={styles.plantSelector}>
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
                                <View style={styles.plantTitle}>

                                    <View style={styles.plantName}>
                                        <Text >{item.plant_name}</Text>
                                    </View>

                                    <View style={styles.plantType}>
                                        <Text >{item.plant_type}</Text>
                                    </View>

                                </View>

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

    },
    plantName: {
        flex: 1,
        // left: 0,
        justifyContent: 'center',
        alignItems: 'flex-start',
        // backgroundColor: '#038b10',
     
    },
    plantType: {
        backgroundColor: 'transparent',
        padding: width * 0.01,


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
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 6,
    },
    activeDot: {
        backgroundColor: '#22C55E',
        width: 10,
        height: 10,
    },
});
