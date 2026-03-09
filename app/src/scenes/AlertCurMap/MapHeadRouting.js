import React from "react";
import { View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Surface } from "react-native-paper";
import { getDistance } from "geolib";
import { createStyles, useTheme } from "~/theme";

import RoutingStep from "./RoutingStep";

import Text from "~/components/Text";
import {
  arrivalInstruction,
  departInstruction,
} from "~/lib/geo/osrmTextInstructions";

import RoutingCalculating from "./RoutingCalculating.js";

import {
  STATE_CALCULATING_LOADED,
  STEP_KIND_DEPART,
  STEP_KIND_NORMAL,
  STEP_KIND_ARRIVE,
  STEP_KIND_BOTH,
} from "./constants";

export default function MapHeadRouting({
  instructions,
  distance,
  profileDefaultMode,
  openStepper,
  openStepperTriggerRef,
  seeAllStepsTriggerRef,
  calculatingState,
}) {
  const { colors } = useTheme();

  let instruction = instructions[1];
  if (!instruction) {
    return null;
  }

  let stepKind;
  if (instructions[1]?.[1]?.maneuver.type === "arrive") {
    if (instructions[0]?.[1]?.maneuver.type === "depart") {
      stepKind = STEP_KIND_BOTH;
    } else {
      stepKind = STEP_KIND_ARRIVE;
    }
  } else if (instruction[1].maneuver.type === "depart") {
    stepKind = STEP_KIND_DEPART;
  } else {
    stepKind = STEP_KIND_NORMAL;
  }

  // console.log(JSON.stringify(instruction));
  // console.log(arriving, instruction[1].maneuver.type);

  switch (stepKind) {
    case STEP_KIND_DEPART:
    case STEP_KIND_BOTH:
      instruction = departInstruction(instructions[0], instructions[1]);
      break;
    case STEP_KIND_ARRIVE:
      instruction = arrivalInstruction(instructions[0], instructions[1]);
      break;
    case STEP_KIND_NORMAL:
      break;
  }

  const displayOpenStepperButton =
    stepKind !== STEP_KIND_ARRIVE &&
    calculatingState === STATE_CALCULATING_LOADED;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        width: "100%",
        paddingVertical: 4,
        paddingHorizontal: 4,
        flexDirection: "column",
      }}
    >
      <Pressable
        ref={openStepperTriggerRef}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les étapes de navigation"
        accessibilityHint="Ouvre la liste complète des étapes de l'itinéraire."
        onPress={() => openStepper(openStepperTriggerRef)}
        style={{
          justifyContent: "center",
          backgroundColor: colors.surface,
          borderRadius: 8,
          ...(displayOpenStepperButton
            ? {
                borderBottomLeftRadius: 0,
              }
            : {}),
          paddingHorizontal: 10,
        }}
      >
        {calculatingState === STATE_CALCULATING_LOADED && (
          <RoutingStep
            key="head-routing-step"
            instructions={instructions}
            instruction={instruction}
            profileDefaultMode={profileDefaultMode}
            stepKind={stepKind}
            isHeading
          />
        )}
        {calculatingState !== STATE_CALCULATING_LOADED && (
          <RoutingCalculating
            key="head-routing-calculating"
            calculatingState={calculatingState}
          />
        )}
      </Pressable>
      <View
        style={{
          flexWrap: "wrap",
        }}
      >
        <View
          style={{
            borderTopWidth: 0.1,
            backgroundColor: colors.surface,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          {displayOpenStepperButton && (
            <Button
              ref={seeAllStepsTriggerRef}
              compact
              rippleColor={colors.secondary}
              accessibilityLabel={"Voir toutes les étapes"}
              accessibilityHint="Affiche toutes les étapes de l'itinéraire."
              contentStyle={{
                flexDirection: "row-reverse",
              }}
              style={{
                borderRadius: 0,
              }}
              onPress={() => openStepper(seeAllStepsTriggerRef)}
              icon={() => (
                <MaterialCommunityIcons
                  name={"chevron-right"}
                  size={20}
                  color={colors.secondary}
                  style={{}}
                />
              )}
            >
              <Text
                style={{
                  color: colors.secondary,
                  fontSize: 12,
                }}
              >
                Voir toutes les étapes
              </Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

// const useStyles = createStyles(
//   ({ wp, hp, scaleText, theme: { colors } }) => ({})
// );
