import { Tabs } from 'expo-router';
import { ChartLine, Heart, Sprout, UserRound } from 'lucide-react-native';
import { Platform, StyleSheet } from 'react-native';
import { AddPlantButton } from '../components/add_plant_button';
import { InfoButton } from '../components/plant_score_info';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'none',
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#8aaa8a',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="main_plant"
        options={{
          title: 'My Plants',
          tabBarIcon: ({ color, size }) => (
            <Sprout color={color} size={size} />
          ),
          headerRight: () => <AddPlantButton />,
        }}
      />
      <Tabs.Screen
        name="plant_score"
        options={{
          title: 'Plant Score',
          tabBarIcon: ({ color, size }) => (
            <Heart color={color} size={size} />
          ),
          headerRight: () => <InfoButton />,
        }}
      />
      <Tabs.Screen
        name="plant_graphs"
        options={{
          title: 'Plant Data',
          tabBarIcon: ({ color, size }) => (
            <ChartLine color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#2e7d32',
    borderTopWidth: 1,
    borderTopColor: '#e0ede0',
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 8,
    paddingBottom: 20,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  header: {
    backgroundColor: '#2e7d32',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff', 
    letterSpacing: -0.3,
  },
});