import React, { useCallback, useEffect, useRef } from "react";
import { Button, Portal, Modal, IconButton, Avatar } from "react-native-paper";
import { View, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ImagePicker from "react-native-image-crop-picker";
import { useTheme } from "~/theme";
import { useFormContext } from "react-hook-form";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import {
  ensureCameraPermission,
  ensurePhotoPermission,
} from "~/permissions/mediaPermissions";

import env from "~/env";

import bgColorBySeed from "~/lib/style/bg-color-by-seed";

import Text from "~/components/Text";

import { setA11yFocusAfterInteractions } from "~/lib/a11y";

import network from "~/network";

import { useStyles } from "./styles";

const AVATAR_IMAGE_SIZE = 128;

const addOneAvatar = async (img) => {
  console.log({ img });
  const { uri } = img;
  const fd = new FormData();
  fd.append("data[file]", {
    uri,
    type: `image/png`,
    name: "avatar",
  });
  const response = await network.oaFilesKy.post("avatar", {
    body: fd,
  });
  const json = await response.json();
  const { imageFileUuid } = json;
  return imageFileUuid;
};

const delOneAvatar = async () => {
  await network.oaFilesKy.delete("avatar", {});
};

export default function AvatarModalEdit({ modalState, userId, triggerRef }) {
  const [modal, setModal] = modalState;
  const { colors } = useTheme();
  const styles = useStyles();
  const { watch, setValue } = useFormContext();

  const titleRef = useRef(null);

  const username = watch("username");
  const defaultImage = watch("image");
  const tempImage = watch("tempImage");
  const image = tempImage || defaultImage;

  let imageSrc;
  if (image?.mode === "image") {
    if (image.localImage) {
      // const base64 = `data:${image.localImage.mime};base64,${image.localImage.data}`;
      // imageSrc = { uri: base64 };
      imageSrc = { uri: image.localImage.uri };
    } else if (image.imageFileUuid) {
      imageSrc = {
        uri: `${env.MINIO_URL}/avatar/${image.imageFileUuid}.png`,
      };
    }
  }
  const imageMode = image?.mode || "text";

  const getPicture = useCallback(
    async (mode) => {
      const options = {
        width: AVATAR_IMAGE_SIZE,
        height: AVATAR_IMAGE_SIZE,
        cropping: true,
        // includeBase64: true,
        cropperCircleOverlay: true,
        mediaType: "photo",
        loadingLabelText: "Chargement...",
      };
      if (mode === "text") {
        setValue("tempImage", { mode: "text" });
        return;
      }
      try {
        let pickedImage;
        if (mode === "library") {
          const granted = await ensurePhotoPermission();
          if (!granted) return;
          pickedImage = await ImagePicker.openPicker(options);
        } else if (mode === "camera") {
          const granted = await ensureCameraPermission();
          if (!granted) return;
          pickedImage = await ImagePicker.openCamera({
            ...options,
            useFrontCamera: true,
          });
        }
        const normalizedImage = await ImageResizer.createResizedImage(
          pickedImage.path,
          AVATAR_IMAGE_SIZE,
          AVATAR_IMAGE_SIZE,
          "PNG",
          100,
          0,
          null,
          false,
          {
            mode: "contain",
            onlyScaleDown: true,
          },
        );
        setValue("tempImage", { mode: "image", localImage: normalizedImage });
      } catch (error) {
        console.log(error);
      }
    },
    [setValue],
  );

  const closeModal = useCallback(() => {
    setValue("tempImage", null);
    setModal({
      visible: false,
    });
  }, [setValue, setModal]);

  useEffect(() => {
    if (modal.visible) {
      setA11yFocusAfterInteractions(titleRef);
    }
  }, [modal.visible]);

  const saveImage = useCallback(async () => {
    const imageMode = image?.mode || "text";
    if (imageMode === "image" && image.localImage) {
      const imageFileUuid = await addOneAvatar(image.localImage);
      setValue("image", { mode: "image", imageFileUuid });
    } else if (imageMode === "text") {
      await delOneAvatar(userId);
      setValue("image", { mode: "text" });
    }
    closeModal();
  }, [image?.mode, image.localImage, closeModal, setValue, userId]);

  let color;
  if (imageMode === "text") {
    color = bgColorBySeed(username);
  }

  return (
    <Portal>
      <Modal
        visible={modal.visible}
        onDismiss={closeModal}
        contentContainerStyle={styles.bottomModalContentContainer}
        accessibilityViewIsModal
      >
        <Text
          ref={titleRef}
          accessibilityRole="header"
          style={{ fontSize: 16, fontWeight: "bold" }}
        >
          Photo de profil
        </Text>

        <View style={{ flexDirection: "column", alignItems: "center" }}>
          {imageMode === "image" && imageSrc && (
            <Image
              source={imageSrc}
              style={{
                width: 120,
                height: 120,
                borderRadius: 120,
                padding: 20,
              }}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}
          {imageMode === "text" && (
            <Avatar.Text
              size={120}
              label={username ? username.slice(0, 1).toUpperCase() : "0"}
              backgroundColor={color}
            />
          )}
          <MaterialCommunityIcons
            name="pencil-circle"
            size={32}
            color={colors.primary}
            style={{
              right: -45,
              top: -35,
            }}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <IconButton
              mode="outlined"
              icon={(props) => (
                <MaterialCommunityIcons
                  name="format-text-variant-outline"
                  size={24}
                  color={props.color}
                />
              )}
              iconColor={colors.primary}
              size={32}
              onPress={() => getPicture("text")}
              accessibilityLabel="Utiliser un avatar texte"
              accessibilityHint="Affiche une lettre comme photo de profil"
            />
            <Text>Texte</Text>
          </View>
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <IconButton
              mode="outlined"
              icon={(props) => (
                <MaterialCommunityIcons
                  name="camera"
                  size={24}
                  color={props.color}
                />
              )}
              iconColor={colors.primary}
              size={32}
              onPress={() => getPicture("camera")}
              accessibilityLabel="Prendre une photo"
              accessibilityHint="Ouvre l'appareil photo"
            />
            <Text>Photo</Text>
          </View>
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <IconButton
              mode="outlined"
              icon={(props) => (
                <MaterialCommunityIcons
                  name="image"
                  size={24}
                  color={props.color}
                />
              )}
              iconColor={colors.primary}
              size={32}
              onPress={() => getPicture("library")}
              accessibilityLabel="Choisir une photo dans la galerie"
              accessibilityHint="Ouvre la galerie de photos"
            />
            <Text>Galerie</Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            paddingTop: 20,
          }}
        >
          <Button
            onPress={() => {
              closeModal();
              if (triggerRef?.current) {
                setA11yFocusAfterInteractions(triggerRef);
              }
            }}
            mode="contained"
          >
            Annuler
          </Button>
          <Button onPress={saveImage} mode="contained">
            OK
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
