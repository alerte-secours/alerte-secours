import { View } from "react-native";
import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Text from "~/components/Text";
import useStyles from "./styles";

import { phoneCallEmergency } from "~/lib/phone-call";

export default function PhoneCallEmergency() {
  const styles = useStyles();
  return (
    <View>
      <View style={[styles.actionContainer, styles.actionSms]}>
        <Button
          mode="contained"
          icon={() => (
            <MaterialCommunityIcons
              name="phone"
              style={[styles.actionIcon, styles.actionSmsIcon]}
            />
          )}
          style={[styles.actionButton, styles.actionSmsButton]}
          onPress={() => phoneCallEmergency()}
        >
          <Text style={[styles.actionText, styles.actionSmsText]}>
            Appeler les urgences
          </Text>
        </Button>
      </View>
    </View>
  );
}
