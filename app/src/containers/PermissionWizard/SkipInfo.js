import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Title } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { permissionWizardActions } from "~/stores";
import CustomButton from "~/components/CustomButton";
import Text from "~/components/Text";
import { setA11yFocusAfterInteractions } from "~/lib/a11y";

const SkipInfo = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const titleRef = useRef(null);

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

  const handleFinish = () => {
    permissionWizardActions.setCompleted(true);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.imageContainer}>
              <Image
                source={require("~/assets/img/wizard-skip.png")}
                style={styles.titleImage}
                resizeMode="contain"
                accessible={false}
                importantForAccessibility="no"
              />
            </View>
            <Title
              ref={titleRef}
              accessibilityRole="header"
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Bon... D'accord...{"\n"}
              <Text style={styles.subtitle}>On ne vous en veut pas !</Text>
            </Title>
          </View>

          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Batman est un peu déçu, mais il comprend... Enfin, il essaie ! 😅
          </Text>

          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Si jamais vous changez d'avis (ce qui serait vraiment SUPER cool),
            voici comment faire :
          </Text>

          <View style={styles.steps}>
            <Text
              style={[styles.step, { color: theme.colors.onSurfaceVariant }]}
            >
              1. Cliquez sur le menu ☰ en haut à droite{"\n"}
              (Oui, ce petit truc avec trois lignes qui ressemble à un hamburger
              minimaliste)
            </Text>

            <Text
              style={[styles.step, { color: theme.colors.onSurfaceVariant }]}
            >
              2. Sélectionnez "Paramètres"{"\n"}
              (C'est là où se cachent tous les secrets !)
            </Text>

            <Text
              style={[styles.step, { color: theme.colors.onSurfaceVariant }]}
            >
              3. Descendez tout en bas{"\n"}
              (Un peu de sport ne fait pas de mal)
            </Text>

            <Text
              style={[styles.step, { color: theme.colors.onSurfaceVariant }]}
            >
              4. Et voilà ! Vous pourrez activer les permissions quand vous
              serez prêt(e) à rejoindre l'aventure !
            </Text>
          </View>

          <Text
            style={[styles.funnyNote, { color: theme.colors.onSurfaceVariant }]}
          >
            En attendant, on garde votre cape et votre masque au chaud... 🦇
            {"\n"}
            (Promis, on ne les donnera pas à quelqu'un d'autre !)
          </Text>

          <View style={styles.buttonContainer}>
            <CustomButton mode="contained" onPress={handleFinish}>
              C'est noté, à bientôt !
            </CustomButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  imageContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  titleImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 22,
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  steps: {
    marginVertical: 10,
  },
  step: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  funnyNote: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default SkipInfo;
