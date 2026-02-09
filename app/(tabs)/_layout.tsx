import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="main_plant" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );

}
