import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAggregatedMessagesState, useAlertState } from "~/stores";
import ColoredDot from "~/components/ColoredDot";

import AlertCurMap from "~/scenes/AlertCurMap";
import AlertCurMessage from "~/scenes/AlertCurMessage";
import AlertCurOverview from "~/scenes/AlertCurOverview";

const Tab = createBottomTabNavigator();

function Tabs() {
  const { navAlertCur } = useAlertState(["navAlertCur"]);
  const { messagesList } = useAggregatedMessagesState(["messagesList"]);

  const hasUnreadMessagesForCurrentAlert =
    navAlertCur &&
    navAlertCur.alert &&
    messagesList.some(
      (msg) => !msg.isRead && msg.alertId === navAlertCur.alert.id,
    );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 13,
        },
      }}
    >
      <Tab.Screen
        name="AlertCurOverview"
        component={AlertCurOverview}
        // initialParams={}
        options={{
          title: "Situation",
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons name="adjust" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AlertCurMessage"
        component={AlertCurMessage}
        options={{
          title: "Messages",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ position: "relative" }}>
              <MaterialCommunityIcons
                name="chat-outline"
                color={color}
                size={size}
              />
              {hasUnreadMessagesForCurrentAlert && (
                <ColoredDot
                  style={{
                    position: "absolute",
                    right: 2,
                    top: 0,
                  }}
                  size={12}
                />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AlertCurMap"
        component={AlertCurMap}
        options={{
          title: "Carte",
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default React.memo(Tabs);
