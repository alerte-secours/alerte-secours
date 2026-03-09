import React, { useEffect, useRef, useCallback } from "react";
import { TouchableOpacity, Animated, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useParamsState, useNotificationsState } from "~/stores";
import { createStyles } from "~/theme";
import Text from "~/components/Text";
import { MaterialIcons } from "@expo/vector-icons";

export default function NotificationsButton({ flex = 1 }) {
  const navigation = useNavigation();
  const { hasRegisteredRelatives } = useParamsState(["hasRegisteredRelatives"]);
  const { newCount } = useNotificationsState(["newCount"]);
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const hasNewNotifications = newCount > 0;

  // Function to create blinking animation
  const blinkTwice = useCallback(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0.2,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.2,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim]);

  // Trigger blinking animation when notifications count changes
  useEffect(() => {
    if (hasNewNotifications) {
      blinkTwice();
    }
  }, [hasNewNotifications, blinkTwice]);

  const styles = useStyles();

  return (
    <View style={{ flex }}>
      <TouchableOpacity
        style={styles.button}
        accessibilityLabel={
          hasNewNotifications
            ? `Notifications - ${newCount} nouvelles notifications`
            : "Notifications"
        }
        accessibilityHint="Ouvre l'écran des notifications."
        accessibilityRole="button"
        accessibilityState={{ selected: hasNewNotifications }}
        onPress={() => navigation.navigate("Notifications")}
      >
        <MaterialIcons
          name={
            hasNewNotifications ? "notifications-active" : "notifications-none"
          }
          size={24}
          color={styles.buttonText.color}
          style={styles.icon}
        />
        {hasNewNotifications ? (
          <Animated.Text style={[styles.buttonText, { opacity: opacityAnim }]}>
            Notifications
          </Animated.Text>
        ) : (
          <Text style={styles.buttonText}>Notifications</Text>
        )}
        {hasNewNotifications && (
          <Animated.Text
            style={[styles.buttonTextNumber, { opacity: opacityAnim }]}
          >
            {`(${newCount})`}
          </Animated.Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    flex: 1,
    minHeight: 48, // Consistent with RadarButton for accessibility
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  buttonTextNumber: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  icon: {
    color: colors.onSurface,
    marginRight: 10,
  },
}));
