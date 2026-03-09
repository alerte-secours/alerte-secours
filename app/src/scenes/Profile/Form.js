import React, { useCallback, useEffect } from "react";

import { View } from "react-native";

import { useMutation } from "@apollo/client";

import { SAVE_PROFILE_MUTATION } from "./gql";

import { useSessionState } from "~/stores";

import PhoneNumbers from "./PhoneNumbers";

import AccountManagement from "./AccountManagement";
import AvatarUploader from "./AvatarUploader";

import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useForm, FormProvider } from "react-hook-form";

import { ajvResolver } from "@hookform/resolvers/ajv";

import { useTheme } from "~/theme";

import { ajvSchemaOptions } from "~/lib/ajv";

import { useStyles } from "./styles";

import Identification from "./Identification";

import useCheckEmailRegistered from "~/hooks/queries/useCheckEmailRegistered";

import { announceForA11yIfScreenReaderEnabled } from "~/lib/a11y";

const schema = {
  type: "object",
  properties: {
    login: { type: "string" },
    email: {
      type: "string",
      pattern: "^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", // format: "email" doesn't seem to allow optional (tried many approaches)
      errorMessage: {
        pattern: "adresse email invalide",
      },
    },
  },
};

export default function Form({
  profileData,
  openAccountModal,
  waitingSmsType,
  clearAuthWaitParams,
}) {
  const { userId } = useSessionState(["userId"]);

  const [saveProfileMutation] = useMutation(SAVE_PROFILE_MUTATION, {});

  const { colors, custom } = useTheme();
  const styles = useStyles();

  const { selectOneUser: oneUser } = profileData;
  const username = oneUser.username;
  const email = oneUser.manyEmail[0]?.email || "";
  const imageFileUuid = oneUser.oneUserAvatar?.imageFileUuid;

  const { checkEmailIsRegistered } = useCheckEmailRegistered();

  const methods = useForm({
    mode: "onBlur",
    defaultValues: {
      username,
      email,
      image: imageFileUuid
        ? { mode: "image", imageFileUuid }
        : { mode: "text" },
      tempImage: null,
    },
    resolver: ajvResolver(schema, ajvSchemaOptions),
  });

  const {
    handleSubmit,
    clearErrors,
    setError,
    getValues,
    setFieldValue,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    const firstErrorMessage = methods.formState?.errors
      ? Object.values(methods.formState.errors)
          .map((e) => e?.message)
          .find(Boolean)
      : null;
    if (!firstErrorMessage) return;

    announceForA11yIfScreenReaderEnabled(firstErrorMessage);
  }, [methods.formState?.errors]);

  useEffect(() => {
    if (!getValues("username") && username) {
      setFieldValue(username);
    }
  }, [username, getValues, setFieldValue]);

  const onSubmit = useCallback(
    async (data) => {
      if (data.email && !(email && email === data.email)) {
        const isRegistered = await checkEmailIsRegistered(data.email);
        if (isRegistered) {
          setError("email", {
            type: "custom",
            message:
              "Cette adresse email est déjà enregistrée pour un autre compte",
          });
          return;
        }
      }

      clearErrors("email");

      await saveProfileMutation({
        variables: {
          userId,
          email: data.email,
          username: data.username,
        },
      });

      methods.reset(data);
    },
    [
      checkEmailIsRegistered,
      clearErrors,
      email,
      methods,
      saveProfileMutation,
      setError,
      userId,
    ],
  );

  return (
    <FormProvider {...methods}>
      <View
        style={{
          marginVertical: 10,
          paddingBottom: 80,
        }}
      >
        <View
          style={{
            borderBottomColor: "rgba(0, 0, 0, 0.1)",
            borderBottomWidth: 1,
            paddingBottom: 20,
            marginHorizontal: 5,
          }}
        >
          <View>
            <AvatarUploader data={profileData} userId={userId} />
          </View>
          <View
            style={{
              borderBottomColor: "rgba(0, 0, 0, 0.1)",
              borderBottomWidth: 1,
            }}
          >
            <PhoneNumbers
              data={profileData}
              waitingSmsType={waitingSmsType}
              clearAuthWaitParams={clearAuthWaitParams}
            />
          </View>

          <View
            style={{
              paddingTop: 20,
            }}
          >
            <Identification profileData={profileData} />
          </View>

          <View style={{ flex: 1, paddingTop: 20 }}>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={{ ...styles.formButton }}
              disabled={!isDirty}
              icon={() => (
                <MaterialCommunityIcons
                  name="check-bold"
                  size={22}
                  color={!isDirty ? colors.onPrimary + "50" : colors.onPrimary}
                />
              )}
              labelStyle={{
                color: !isDirty ? colors.onPrimary + "50" : colors.onPrimary,
              }}
            >
              Enregistrer
            </Button>
          </View>
        </View>
        <View style={{ marginVertical: 10 }}>
          <AccountManagement
            profileData={profileData}
            openAccountModal={openAccountModal}
            waitingSmsType={waitingSmsType}
            clearAuthWaitParams={clearAuthWaitParams}
          />
        </View>
      </View>
    </FormProvider>
  );
}
