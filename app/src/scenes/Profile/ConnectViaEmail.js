import { View } from "react-native";
import { Button } from "react-native-paper";

import { ajvResolver } from "@hookform/resolvers/ajv";
import { useForm, FormProvider } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import FieldInputText from "~/containers/FieldInputText";
import Text from "~/components/Text";

import { ajvSchemaOptions } from "~/lib/ajv";
import useCheckEmailRegistered from "~/hooks/queries/useCheckEmailRegistered";
import { useTheme } from "~/theme";
import { useStyles } from "./styles";
import { useCallback, useEffect } from "react";

import { SEND_CONNECTION_EMAIL_MUTATION } from "./gql";
import { useMutation } from "@apollo/client";

import { announceForA11yIfScreenReaderEnabled } from "~/lib/a11y";

const schema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
      errorMessage: {
        format: "adresse email invalide",
      },
    },
  },
};
export default function ConnectViaEmail() {
  const styles = useStyles();
  const { colors, custom } = useTheme();
  const methods = useForm({
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
    resolver: ajvResolver(schema, ajvSchemaOptions),
  });
  const {
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = methods;

  const { checkEmailIsRegistered } = useCheckEmailRegistered();

  const [doAuthEmailSendConnectionEmail] = useMutation(
    SEND_CONNECTION_EMAIL_MUTATION,
  );
  const sendConnectionEmail = useCallback(
    async (email) => {
      await doAuthEmailSendConnectionEmail({
        variables: {
          email,
        },
      });
    },
    [doAuthEmailSendConnectionEmail],
  );

  const onSubmit = useCallback(
    async (data) => {
      const isRegistered = await checkEmailIsRegistered(data.email);
      if (!isRegistered) {
        setError("email", {
          type: "custom",
          message: "Cette adresse email n'est pas enregistrée",
        });
        return;
      }
      clearErrors("email");
      sendConnectionEmail(data.email);
    },
    [checkEmailIsRegistered, clearErrors, sendConnectionEmail, setError],
  );

  useEffect(() => {
    if (!errors?.email?.message) return;
    announceForA11yIfScreenReaderEnabled(errors.email.message);
  }, [errors?.email?.message]);

  return (
    <FormProvider {...methods}>
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View style={{ flex: 1, flexDirection: "column" }}>
          <FieldInputText
            style={styles.textInput}
            label="Email"
            name="email"
            error={errors.email}
            errorMessage={errors.email?.message}
            mode="outlined"
            autoFocus
          />
          {errors.email && (
            <View style={{}}>
              <Text style={{ color: colors.error }}>
                {errors.email.message}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={{ ...styles.formButton }}
            icon={() => (
              <MaterialCommunityIcons
                name="check-bold"
                size={22}
                color={colors.onPrimary}
              />
            )}
          >
            Se connecter
          </Button>
        </View>
      </View>
    </FormProvider>
  );
}
