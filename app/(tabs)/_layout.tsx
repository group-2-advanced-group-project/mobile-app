import { Tabs } from "expo-router";
import { Sprout, UserRound } from 'lucide-react-native';

export default function RootLayout() {
  return (
    <Tabs
    >
      <Tabs.Screen
        name="main_plant"
        options={{
          title: 'My Plants',
          tabBarIcon: () => <Sprout />,
          // tabBarInactiveTintColor: '#45b65f',
          tabBarActiveTintColor: '#45b65f',
        }}
      />
      <Tabs.Screen name="plant_graphs" />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <UserRound />,
          // tabBarInactiveTintColor: '#45b65f',
          tabBarActiveTintColor: '#45b65f',
        }}
      />
    </Tabs>
  );

}
