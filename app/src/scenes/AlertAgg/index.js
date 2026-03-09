import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAggregatedMessagesState } from "~/stores";
import ColoredDot from "~/components/ColoredDot";

import AlertAggList from "~/scenes/AlertAggList";
import AlertAggMap from "~/scenes/AlertAggMap";
import AlertAggMessage from "~/scenes/AlertAggMessage";

const Tab = createBottomTabNavigator();

export default function AlertAgg() {
  const { unreadCount } = useAggregatedMessagesState(["unreadCount"]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 13,
        },
        lazy: true,
        unmountOnBlur: true,
      }}
    >
      <Tab.Screen
        name="AlertAggList"
        component={AlertAggList}
        options={{
          title: "Liste",
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="format-list-bulleted"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AlertAggMap"
        component={AlertAggMap}
        options={{
          title: "Carte",
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AlertAggMessage"
        component={AlertAggMessage}
        options={{
          title: "Messages",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ position: "relative" }}>
              <MaterialCommunityIcons
                name="chat-outline"
                color={color}
                size={size}
              />
              {unreadCount > 0 && (
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
    </Tab.Navigator>
  );
}
