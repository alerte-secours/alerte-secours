import { Button } from "react-native-paper";
import sendSMS from "~/lib/sms/sendSMS";
import countryCodesList from "country-codes-list";
import Text from "~/components/Text";
import { removeLeadingZero } from "~/utils/phone";

export default function ErrorMessageNotRegistered({
  phoneCountry,
  phoneNumber,
  title = "Ce numéro de téléphone n'est pas enregistré",
}) {
  const appLink = "https://app.alertesecours.fr";

  return (
    <>
      <Text style={{ top: 5, fontSize: 16 }}>{title}</Text>
      <Button
        onPress={() => {
          const code = countryCodesList.findOne(
            "countryCode",
            phoneCountry,
          )?.countryCallingCode;
          const fullnumber = `+${code}${removeLeadingZero(phoneNumber)}`;
          sendSMS(
            [fullnumber],
            "Installez l'application Alerte-Secours: " + appLink,
          );
        }}
        style={{
          alignItems: "flex-start",
          marginLeft: -12,
          backgroundColor: "transparent",
        }}
      >
        <Text style={{ fontSize: 16, textDecorationLine: "underline" }}>
          invitez le à rejoindre Alerte-Secours
        </Text>
      </Button>
    </>
  );
}
