import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import Dropdown from 'react-native-input-select';
// import ProvisionScreen from './esp32_connect'


export default function PlantForm() {
    const router = useRouter();
    const { device_id } = useLocalSearchParams();
    console.log(device_id)

    const handleAddPlant = async () => {
        const idToken = await AsyncStorage.getItem("idToken");
        // const decoded = jwtDecode(idToken);
        // const userId = decoded.sub;

        const response = await fetch("https://w9xrldhhs4.execute-api.eu-west-2.amazonaws.com/devices/link", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,  
            },
            body: JSON.stringify({
                device_id: device_id,   
                plant_name: plantName,
                plant_type: plantType,
                location: plantLocation,
                plant_stage: plantStage,            
            }),
        });

        if (!response.ok) {
            console.error("Failed to add plant:", response.status);
            return;
        }

        const data = await response.json();
        console.log(data);
        router.push('/scanner/esp32_connect')

    }

    const [plantName, setPlantName] = useState('')
    const [plantType, setPlantType] = useState('')
    const [plantLocation, setPlantLocation] = useState('')
    const [plantStage, setPlantStage] = useState('Sprout');
    const deviceId = 'PLANT_MATE_TEST_001' // HARDCODED CHANGE TO WHAT YOU GET FROM THE QR CODE

    return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <TextInput
                placeholder="Plant Name"
                onChangeText={newText => setPlantName(newText)}
                defaultValue={plantName}
                style={styles.text_input}
            />
            <TextInput
                placeholder="Plant Type"
                onChangeText={newText => setPlantType(newText)}
                defaultValue={plantType}
                style={styles.text_input}
            />
            <TextInput
                placeholder="Plant Location"
                onChangeText={newText => setPlantLocation(newText)}
                defaultValue={plantLocation}
                style={styles.text_input}
            />
            <Dropdown
                label="Plant Stage"
                placeholder="Select an option..."
                options={[
                    { label: 'Sprout', value: 'Sprout' },
                    { label: 'Seedling', value: 'Seedling' },
                    { label: 'Growing', value: 'Growing' },
                    { label: 'Flower', value: 'Flower' },
                ]}
                selectedValue={plantStage}
                onValueChange={(value) => setPlantStage(value)}
                primaryColor={'green'}
            />
            <Button
                title='Add Plant!'
                onPress={handleAddPlant}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    text_input: {
        height: 40,
        padding: 5,
        marginHorizontal: 8,
        borderWidth: 1,
    }
})