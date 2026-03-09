import React, { useCallback } from "react";

import { View } from "react-native";
import { Button } from "react-native-paper";
import { useMutationWithError } from "~/hooks/apollo";

import Text from "~/components/Text";

import { useStyles } from "./styles";

import { ajvResolver } from "@hookform/resolvers/ajv";
import { useForm, FormProvider } from "react-hook-form";

import FieldInputText from "~/containers/FieldInputText";

import { authActions } from "~/stores";

import { ajvSchemaOptions } from "~/lib/ajv";

import { AUTH_IMPERSONATE } from "./gql";
import { useTheme } from "~/theme";

const schema = {
  type: "object",
  properties: {
    target: {
      type: "string",
      minLength: 1,
    },
  },
  required: ["target"],
};

export default function AccountManagementModalImpersonate({ closeModal }) {
  const styles = useStyles();
  const { colors, custom } = useTheme();

  const methods = useForm({
    mode: "onTouched",
    defaultValues: {
      target: "",
    },
    resolver: ajvResolver(schema, ajvSchemaOptions),
  });
  const {
    handleSubmit,
    formState: { errors },
    setError,
  } = methods;

  const [authImpersonate] = useMutationWithError(AUTH_IMPERSONATE);

  const doImpersonation = useCallback(
    async ({ target }) => {
      const { data, errors } = await authImpersonate({
        variables: { target },
      });
      if (errors) {
        const [error] = errors;
        setError("target", {
          type: "custom",
          message: error.message || "non trouvé",
        });
        return;
      }
      const {
        doAuthImpersonateToken: { authTokenJwt },
      } = data;
      await authActions.impersonate({
        authTokenJwt,
      });
    },
    [authImpersonate, setError],
  );

  const onSubmit = useCallback(
    async (data) => {
      const { target } = data;
      await doImpersonation({ target });
    },
    [doImpersonation],
  );

  return (
    <FormProvider {...methods}>
      <View
        style={{
          flexDirection: "column",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            paddingBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Impersonate
          </Text>
        </View>
        <View style={{ marginVertical: 10 }}>
          <Text
            style={{
              fontSize: 16,
            }}
          >
            S'identifier en tant que
          </Text>

          <View style={{ flex: 1, flexDirection: "column", marginTop: 10 }}>
            <FieldInputText
              style={styles.textInput}
              mode="outlined"
              label="id/username/phone/email/device"
              name="target"
              error={errors.target}
              autoFocus
            />
            {errors.target && (
              <View style={{}}>
                <Text style={{ color: colors.error }}>
                  {errors.target.message}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: "column", flex: 1, paddingTop: 5 }}>
          <Button
            onPress={handleSubmit(onSubmit)}
            mode="contained"
            style={{
              flex: 1,
              justifyContent: "center",
              marginTop: 10,
              marginBottom: 20,
            }}
            contentStyle={{
              height: 60,
            }}
          >
            Login
          </Button>
          <Button
            onPress={() => closeModal()}
            mode="outlined"
            style={{
              flex: 1,
              justifyContent: "center",
            }}
            contentStyle={{
              height: 60,
            }}
          >
            Annuler
          </Button>
        </View>
      </View>
    </FormProvider>
  );
}
