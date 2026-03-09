import { View, ScrollView, Text as RNText } from "react-native";
import { Button, ToggleButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import humanizeDistance from "~/lib/geo/humanizeDistance";
import { useTheme } from "~/theme";

import { profileDefaultModes } from "./routing";

import humanizeDuration from "~/utils/time/humanizeDuration";

import RoutingStep from "./RoutingStep";
import Text from "~/components/Text";
import IconTouchTarget from "~/components/IconTouchTarget";

import { STATE_CALCULATING_LOADED } from "./constants";

import RoutingCalculating from "./RoutingCalculating";

export default function RoutingSteps({
  setProfile,
  profile,
  destinationName,
  closeStepper,
  instructions,
  distance,
  duration,
  calculatingState,
  titleA11yRef,
}) {
  const { colors, custom } = useTheme();
  const profileDefaultMode = profileDefaultModes[profile];

  if (distance === 0) {
    instructions = instructions.slice(1);
  }

  // calculatingState = 2;

  return (
    <>
      <ScrollView
        accessibilityLabel="Liste des étapes de l'itinéraire"
        accessibilityHint="Contient la destination, la distance, la durée et les étapes."
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          paddingTop: 0,
          paddingLeft: 10,
          paddingRight: 10,
          marginTop: 4,
          marginBottom: 4,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <RNText
          ref={titleA11yRef}
          accessibilityRole="header"
          style={{
            paddingTop: 10,
            paddingBottom: 6,
            fontSize: 18,
            fontWeight: "700",
            color: colors.primary,
          }}
        >
          Itinéraire
        </RNText>
        <View
          style={{
            flex: 1,
            paddingTop: 10,
            flexDirection: "row",
          }}
        >
          <ToggleButton.Group onValueChange={setProfile} value={profile}>
            <ToggleButton
              value="car"
              accessibilityRole="radio"
              accessibilityLabel="Itinéraire en voiture"
              accessibilityHint="Sélectionne le mode voiture pour recalculer l'itinéraire."
              accessibilityState={{ selected: profile === "car" }}
              style={{ width: 44, height: 44 }}
              icon={() => {
                return (
                  <MaterialCommunityIcons
                    name="car"
                    size={22}
                    style={{ paddingRight: 5 }}
                  />
                );
              }}
            />
            <ToggleButton
              value="foot"
              accessibilityRole="radio"
              accessibilityLabel="Itinéraire à pied"
              accessibilityHint="Sélectionne le mode à pied pour recalculer l'itinéraire."
              accessibilityState={{ selected: profile === "foot" }}
              style={{ width: 44, height: 44 }}
              icon={() => {
                return (
                  <MaterialCommunityIcons
                    name="walk"
                    size={22}
                    style={{ paddingRight: 5 }}
                  />
                );
              }}
            />
            <ToggleButton
              value="bicycle"
              accessibilityRole="radio"
              accessibilityLabel="Itinéraire à vélo"
              accessibilityHint="Sélectionne le mode vélo pour recalculer l'itinéraire."
              accessibilityState={{ selected: profile === "bicycle" }}
              style={{ width: 44, height: 44 }}
              icon={() => {
                return (
                  <MaterialCommunityIcons
                    name="bike"
                    size={22}
                    style={{ paddingRight: 5 }}
                  />
                );
              }}
            />
          </ToggleButton.Group>
        </View>
        {calculatingState === STATE_CALCULATING_LOADED && (
          <>
            <View
              style={{
                flex: 1,
                paddingTop: 10,
                flexDirection: "row",
              }}
            >
              <Text
                key={"destinationName"}
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: colors.primary,
                  paddingRight: 5,
                }}
              >
                {destinationName}
              </Text>
              <Text
                key="distance"
                style={{ fontSize: 17, color: colors.primary }}
              >
                {humanizeDistance(distance)}
              </Text>
              <Text
                key="duration"
                style={{ fontSize: 17, color: colors.primary }}
              >
                {", " + humanizeDuration(duration)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {instructions.map((instruction, index) => {
                return (
                  <View
                    key={index}
                    style={{
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.active,
                      borderColor: colors.grey,
                    }}
                  >
                    <RoutingStep
                      instructions={instructions}
                      instruction={instruction}
                      profileDefaultMode={profileDefaultMode}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}
        {calculatingState !== STATE_CALCULATING_LOADED && (
          <RoutingCalculating
            key="head-routing-calculating"
            calculatingState={calculatingState}
          />
        )}
      </ScrollView>
      <IconTouchTarget
        accessibilityLabel="Fermer la liste des étapes"
        accessibilityHint="Ferme la liste et revient à la carte."
        onPress={closeStepper}
        style={({ pressed }) => ({
          position: "absolute",
          top: 4,
          right: 0,
          backgroundColor: colors.surface,
          borderRadius: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <MaterialCommunityIcons
          name="close"
          size={26}
          color={colors.onSurface}
        />
      </IconTouchTarget>
    </>
  );
}
