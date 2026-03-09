import React from "react";
import Text from "~/components/Text";
import IconByAlertLevel from "~/components/IconByAlertLevel";
import levelLabel from "~/misc/levelLabel";
import capitalize from "lodash.capitalize";
import AlertInfoLine from "~/containers/AlertInfoLine";
import { useTheme } from "~/theme";

export default function AlertInfoLineLevel({ alert, ...props }) {
  const { colors, custom } = useTheme();

  const { level } = alert;
  const levelColor = custom.appColors[level];

  const levelText = capitalize(levelLabel[level]);

  return (
    <AlertInfoLine
      iconName="alarm-light"
      labelText="Niveau d'alerte"
      valueText={levelText}
      Value={({ ...valueTextProps }) => (
        <>
          <Text {...valueTextProps} />
          <IconByAlertLevel
            size={24}
            level={level}
            style={{ color: levelColor, paddingLeft: 15 }}
          />
        </>
      )}
      {...props}
    />
  );
}
