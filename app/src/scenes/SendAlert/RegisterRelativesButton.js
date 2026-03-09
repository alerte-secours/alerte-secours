import React, { useEffect, useRef } from "react";
import { TouchableOpacity, Animated, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useParamsState, paramsActions, useSessionState } from "~/stores";
import { createStyles } from "~/theme";
import Text from "~/components/Text";
import { Ionicons } from "@expo/vector-icons";
import { useLazyQuery } from "@apollo/client";

import QUERY_HAS_RELATIVE from "~/gql/queries/hasRelative";

export default function RegisterRelativesButton() {
  const navigation = useNavigation();
  const { hasRegisteredRelatives } = useParamsState(["hasRegisteredRelatives"]);
  const { userId } = useSessionState(["userId"]);
  const [fetchHasRelative, { loading, error, data }] = useLazyQuery(
    QUERY_HAS_RELATIVE,
    {
      variables: {
        userId,
      },
    },
  );

  useEffect(() => {
    if (hasRegisteredRelatives === null) {
      fetchHasRelative();
    }
  }, [hasRegisteredRelatives, fetchHasRelative]);

  useEffect(() => {
    if (!data) {
      return;
    }
    const hasRegisteredRelatives =
      data.selectManyRelative.length > 0 ||
      data.selectManyRelativeUnregistered.length > 0;
    paramsActions.setHasRegisteredRelatives(hasRegisteredRelatives);
  }, [data]);

  const styles = useStyles();
  const fadeAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  if (hasRegisteredRelatives || loading) {
    return null;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Enregistrez vos contacts d'urgence"
        accessibilityHint="Ouvre l'écran pour enregistrer vos contacts d'urgence."
        style={styles.button}
        onPress={() => navigation.navigate("Relatives")}
      >
        <Ionicons
          name="notifications-outline"
          size={24}
          color={styles.buttonText.color}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>
          Enregistrez vos contacts d'urgence
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const useStyles = createStyles(({ theme: { colors } }) => ({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: "20%",
    backgroundColor: colors.surface,
    borderRadius: 8,
    width: "100%",
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
    flex: 1,
  },
  icon: {
    color: colors.onSurface,
    marginRight: 10,
  },
}));
