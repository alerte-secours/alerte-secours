import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, StyleSheet, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Entypo } from "@expo/vector-icons";
import { useTheme } from "~/theme";

import CustomButton from "~/components/CustomButton";
import Text from "~/components/Text";

import {
  registerHandler,
  unregisterHandler,
  resolveDisclosure,
} from "~/permissions/backgroundLocationDisclosureManager";

const DISCLOSURE_TEXT = `Alerte Secours collecte vos données de localisation pour permettre de vous alerter lorsqu'une personne à proximité a besoin d'aide urgente, même lorsque l'application est fermée ou non utilisée.

Votre position est utilisée en arrière-plan pour :

\u2022 Détecter les situations d'urgence à proximité de vous
\u2022 Vous envoyer des alertes en temps réel
\u2022 Permettre aux personnes en détresse de signaler leur position aux secouristes proches

Vos données de localisation sont transmises de façon sécurisée à nos serveurs uniquement dans le cadre du fonctionnement du service Alerte Secours et ne sont pas partagées avec des tiers.`;

const BackgroundLocationDisclosure = () => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pendingRef = useRef(false);

  const show = useCallback(() => {
    pendingRef.current = true;
    setVisible(true);
  }, []);

  useEffect(() => {
    registerHandler(show);
    return () => {
      unregisterHandler();
    };
  }, [show]);

  const handleAccept = useCallback(() => {
    pendingRef.current = false;
    setVisible(false);
    resolveDisclosure(true);
  }, []);

  const handleDecline = useCallback(() => {
    pendingRef.current = false;
    setVisible(false);
    resolveDisclosure(false);
  }, []);

  if (Platform.OS !== "android") {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleDecline}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              theme.colors.backdrop || theme.colors.scrim || "rgba(0,0,0,0.5)",
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View
          style={[styles.content, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.header}>
            <Entypo
              name="location"
              size={28}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Accès à la localisation en arrière-plan
            </Text>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.text, { color: theme.colors.onSurface }]}>
              {DISCLOSURE_TEXT}
            </Text>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <CustomButton mode="contained" onPress={handleAccept}>
              Accepter et continuer
            </CustomButton>
            <CustomButton mode="outlined" onPress={handleDecline}>
              Non merci
            </CustomButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    borderRadius: 12,
    width: "100%",
    maxWidth: 520,
    maxHeight: "85%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexShrink: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollViewContent: {
    paddingBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 12,
    gap: 8,
  },
});

export default BackgroundLocationDisclosure;
