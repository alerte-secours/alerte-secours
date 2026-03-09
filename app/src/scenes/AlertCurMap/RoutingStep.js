import React from "react";
import { View, Image } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import StyledText from "react-native-styled-text";

import Text from "~/components/Text";

import humanizeDistance from "~/lib/geo/humanizeDistance";
import { ROUND_DISTANCE } from "~/lib/geo/constants";

import { useTheme } from "~/theme";

import {
  stepIcons,
  laneIcons,
  getIconName,
  stepToLanes,
  modeIcons,
} from "./routing";

import {
  STEP_KIND_DEPART,
  STEP_KIND_NORMAL,
  STEP_KIND_ARRIVE,
} from "./constants";

export default function RoutingStep({
  instructions,
  instruction,
  profileDefaultMode,
  stepKind,
  isHeading,
}) {
  const { colors, custom } = useTheme();

  const [instructionText, step, index] = instruction;

  const iconName = getIconName(step, index);
  const lanes = stepToLanes(step);
  // console.log(JSON.stringify(lanes, null, 2));
  const modifierIcon = iconName ? stepIcons[iconName] : null;
  const { mode } = step;
  let { distance } = step;

  if (isHeading) {
    distance = instructions[0][1].distance;
  }

  const modeIcon = modeIcons[mode];
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          justifyContent: "center",
          width: 42,
        }}
      >
        {iconName === "depart" && (
          <MaterialCommunityIcons
            name={modeIcon}
            color={colors.secondary}
            size={20}
          />
        )}
        {iconName === "arrive" && (
          <MaterialCommunityIcons
            name={"map-marker-check"}
            color={colors.secondary}
            size={20}
          />
        )}
        {modifierIcon && (
          <Image style={{ width: 20, height: 20 }} source={modifierIcon} />
        )}
      </View>
      <View
        style={{
          paddingTop: 15,
          paddingBottom: 15,
          flex: 1,
        }}
      >
        <StyledText
          style={{
            fontSize: 15,
            color: colors.onBackground,
            textAlignVertical: "center",
          }}
        >
          {instructionText}
        </StyledText>
        {lanes.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              paddingTop: 5,
            }}
          >
            {lanes.map((lane, index) => {
              const laneIcon = laneIcons[lane.icon];
              const laneIconSize = 20;
              return (
                <View
                  key={index}
                  style={{
                    width: laneIconSize,
                    height: laneIconSize,
                    ...(!lane.valid ? { opacity: 0.5 } : {}),
                    ...(lane.superposed ? { left: -1 * laneIconSize } : {}),
                  }}
                >
                  {laneIcon && (
                    <Image
                      style={{
                        width: laneIconSize,
                        height: laneIconSize,
                      }}
                      source={laneIcon}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: isHeading ? "center" : "flex-end",
          paddingLeft: 10,
        }}
      >
        {profileDefaultMode && mode !== profileDefaultMode && modeIcon && (
          <MaterialCommunityIcons
            name={modeIcon}
            size={14}
            style={{ paddingHorizontal: 5 }}
          />
        )}
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
          {!(isHeading && stepKind === STEP_KIND_ARRIVE) &&
          distance >= ROUND_DISTANCE
            ? humanizeDistance(distance)
            : ""}
        </Text>
      </View>
    </View>
  );
}
