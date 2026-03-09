import React, { useCallback, useEffect } from "react";

import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  MaterialCommunityIcons,
  AntDesign,
  MaterialIcons,
} from "@expo/vector-icons";
import { useMutation } from "@apollo/client";
import Text from "~/components/Text";

import FieldInputText from "~/containers/FieldInputText";

import { useTheme } from "~/theme";
import { useStyles } from "./styles";
import { useFormContext } from "react-hook-form";

import { RESEND_VERIFICATION_EMAIL_MUTATION } from "./gql";

import { announceForA11yIfScreenReaderEnabled } from "~/lib/a11y";

export default function Identification({ profileData }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { selectOneUser: oneUser } = profileData;
  const email = oneUser.manyEmail[0]?.email || "";
  const emailVerified = oneUser.manyEmail[0]?.verified;
  const {
    watch,
    formState: { errors },
  } = useFormContext();
  const emailInput = watch("email");
  const [resendVerificationEmail] = useMutation(
    RESEND_VERIFICATION_EMAIL_MUTATION,
  );
  const sendValidationEmail = useCallback(async () => {
    await resendVerificationEmail({
      variables: {
        email,
      },
    });
  }, [resendVerificationEmail, email]);

  useEffect(() => {
    if (!errors?.email?.message) return;
    announceForA11yIfScreenReaderEnabled(errors.email.message);
  }, [errors?.email?.message]);
  return (
    <View>
      <View>
        <FieldInputText
          style={styles.textInput}
          label="Nom d'utilisateur"
          name="username"
          accessibilityLabel="Nom d'utilisateur"
          accessibilityHint="Modifier votre nom d'utilisateur"
        />
      </View>
      <View>
        <FieldInputText
          style={styles.textInput}
          right={
            email && emailInput === email && emailVerified ? (
              <TextInput.Icon
                icon={() => (
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color={colors.ok}
                  />
                )}
              />
            ) : null
          }
          label="Email"
          name="email"
          error={errors.email}
          accessibilityLabel="Email"
          accessibilityHint="Modifier votre adresse email"
          errorMessage={errors.email?.message}
        />
        {emailInput && errors.email && emailInput !== email && (
          <View style={{}}>
            <Text style={{ color: colors.error }}>{errors.email.message}</Text>
          </View>
        )}
        {email && emailInput === email && !emailVerified && (
          <View>
            <View
              style={{
                marginHorizontal: 10,
                marginVertical: 5,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <AntDesign
                  name="warning"
                  size={17}
                  color={colors.error}
                  style={{ marginRight: 5 }}
                />
                <Text style={{ color: colors.error, fontSize: 15 }}>
                  adresse email non vérifiée
                </Text>
              </View>
              <Text style={{ color: colors.onSurface }}>
                un email de confirmation vous a été envoyé, il contient un lien
                vous permettant de valider votre adresse email, n'oubliez pas de
                vérifier votre dossier spams
              </Text>
            </View>
            <Button
              compact
              mode="contained"
              icon={() => (
                <MaterialCommunityIcons
                  name="email-check"
                  size={22}
                  color={colors.onPrimary}
                />
              )}
              style={{ borderRadius: 4, marginHorizontal: 0, marginTop: 5 }}
              uppercase={true}
              onPress={sendValidationEmail}
            >
              <Text style={{ color: colors.onPrimary }}>
                renvoyez moi un email de confirmation
              </Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
