import { View } from "react-native";
import AppLinkPremiersSecours from "~/containers/Links/AppLinks/PremiersSecours";
import Text from "~/components/Text";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createStyles } from "~/theme";

export default function Sheets() {
  const styles = useStyles();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 15,
        width: "100%",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <MaterialCommunityIcons name="vlc" size={24} style={styles.icon} />
        <Text style={{ fontSize: 24 }}>Bientôt disponible</Text>
      </View>
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Text style={{ fontSize: 18, marginVertical: 15 }}>
          en attendant (et même après), l'application Premiers-Secours de la
          Croix-Rouge peut vous aider
        </Text>
        <AppLinkPremiersSecours />
      </View>
    </View>
  );
}
const useStyles = createStyles(({ fontSize, theme: { colors } }) => ({
  icon: {
    marginHorizontal: 10,
    color: colors.primary,
  },
}));
