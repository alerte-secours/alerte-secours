import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "~/theme";
import IconTouchTarget from "~/components/IconTouchTarget";

export default function MapLinksPopupIconButton({
  setIsVisible,
  textProps = {},
  ...extraProps
}) {
  const { colors, custom } = useTheme();
  return (
    <IconTouchTarget
      accessibilityLabel="Ouvrir dans une application de navigation"
      accessibilityHint="Ouvre un choix d'applications pour naviguer vers l'emplacement."
      onPress={() => setIsVisible(true)}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 4,
        opacity: pressed ? 0.7 : 1,
      })}
      {...extraProps}
    >
      <MaterialCommunityIcons
        name="arrow-top-right-bold-box-outline"
        size={24}
        color={colors.onSurface}
      />
    </IconTouchTarget>
  );
}
