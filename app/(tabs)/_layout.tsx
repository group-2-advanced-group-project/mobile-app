import { Tabs } from "expo-router";
import { Sprout, UserRound } from 'lucide-react-native';
// import { Button } from "react-native";
import { AddPlantButton } from "../components/add_plant_button";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={
        {
          animation: 'shift',
          tabBarActiveTintColor: '#45b65f'
        }
      }
    >
      <Tabs.Screen
        name="main_plant"
        options={{
          title: 'My Plants',
          tabBarIcon: ({ color, size }) => <Sprout color={color} size={size} />,
          headerRight: () => (
            <AddPlantButton />
          )
        }}
      />
      <Tabs.Screen name="plant_graphs" />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );

}
