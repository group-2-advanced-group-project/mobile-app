import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs
    >
      <Tabs.Screen
        name="main_plant" 
        options={{
          title: 'My Plants'
        }}
        />
      <Tabs.Screen name="profile" />
    </Tabs>
  );

}
