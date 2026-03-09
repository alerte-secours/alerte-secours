import React, { useCallback, useEffect, useRef } from "react";

import { View } from "react-native";
import { Button } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";
import { useMutation } from "@apollo/client";

import Text from "~/components/Text";

import { useStyles } from "./styles";
import { useTheme } from "~/theme";
import { DESTROY_USER_MUTATION } from "./gql";
import { authActions } from "~/stores";

import {
  announceForA11yIfScreenReaderEnabled,
  setA11yFocusAfterInteractions,
} from "~/lib/a11y";

import { ajvResolver } from "@hookform/resolvers/ajv";
import { useForm, FormProvider } from "react-hook-form";

import FieldInputText from "~/containers/FieldInputText";

import { ajvSchemaOptions } from "~/lib/ajv";

const schema = {
  type: "object",
  properties: {
    validConfirmSentence: {
      type: "string",
    },
    confirmSentence: {
      type: "string",
      const: { $data: "1/validConfirmSentence" },
      errorMessage: {
        const: "le message de confirmation est incorrect",
      },
    },
  },
};

export default function AccountManagementModalDestroy({
  closeModal,
  profileData,
}) {
  const styles = useStyles();
  const { colors, custom } = useTheme();

  const [deleteUser] = useMutation(DESTROY_USER_MUTATION);

  const username = profileData.selectOneUser.username || "anonyme";

  const validConfirmSentence = username;

  const titleRef = useRef(null);
  const confirmInputRef = useRef(null);

  const methods = useForm({
    mode: "onTouched",
    defaultValues: {
      validConfirmSentence,
      confirmSentence: "",
    },
    resolver: ajvResolver(schema, ajvSchemaOptions),
  });
  const {
    watch,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = methods;

  const validConfimSentenceState = watch("validConfirmSentence");
  useEffect(() => {
    if (validConfirmSentence !== validConfimSentenceState) {
      setValue("validConfirmSentence", validConfirmSentence);
    }
  }, [validConfirmSentence, validConfimSentenceState, setValue]);

  const confimSentenceState = watch("confirmSentence");
  useEffect(() => {
    clearErrors("confirmSentence");
  }, [clearErrors, confimSentenceState]);

  const onSubmit = useCallback(async () => {
    await deleteUser();
    await authActions.logout();
  }, [deleteUser]);

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  useEffect(() => {
    if (!errors?.confirmSentence?.message) return;
    announceForA11yIfScreenReaderEnabled(errors.confirmSentence.message);
    setA11yFocusAfterInteractions(confirmInputRef);
  }, [errors?.confirmSentence?.message]);

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
            ref={titleRef}
            accessibilityRole="header"
            style={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Supprimer le compte
          </Text>
        </View>
        <View style={{ marginVertical: 10 }}>
          <Text
            style={{
              fontSize: 16,
            }}
          >
            {`Vous ête sur le point de supprimer le compte "${username}".`}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 20,
            }}
          >
            <AntDesign
              name="warning"
              size={17}
              color={colors.error}
              style={{ marginRight: 5 }}
            />
            <Text
              style={{
                fontSize: 16,
              }}
            >
              Cette action est irréversible.
            </Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 16,
              }}
            >
              {`Pour confirmer la suppression du compte veuillez taper "${validConfirmSentence}" dans le champ "message de confirmation" et cliquer sur le button SUPPRIMER`}
            </Text>
          </View>

          <View style={{ flex: 1, flexDirection: "column", marginTop: 10 }}>
            <FieldInputText
              ref={confirmInputRef}
              style={styles.textInput}
              mode="outlined"
              label="Message de confirmation"
              name="confirmSentence"
              error={errors.confirmSentence}
              autoFocus
            />
            {errors.confirmSentence && (
              <View style={{}}>
                <Text style={{ color: colors.error }}>
                  {errors.confirmSentence.message}
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
              backgroundColor: colors.critical,
            }}
            contentStyle={{
              height: 60,
            }}
            accessibilityLabel="Supprimer le compte"
            accessibilityHint="Action irréversible"
          >
            SUPPRIMER
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
