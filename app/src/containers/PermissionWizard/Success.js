import React, { useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Button, Title } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { permissionWizardActions } from "~/stores";
import { useTheme } from "~/theme";
import Text from "~/components/Text";
import CustomButton from "~/components/CustomButton";
import { setA11yFocusAfterInteractions } from "~/lib/a11y";

const Success = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const titleRef = useRef(null);

  const handleFinish = useCallback(() => {
    permissionWizardActions.setCompleted(true);
  }, []);

  useEffect(() => {
    setA11yFocusAfterInteractions(titleRef);
  }, []);

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
          <Image
            source={require("~/assets/img/wizard-success.png")}
            style={styles.titleImage}
            resizeMode="contain"
            accessible={false}
            importantForAccessibility="no"
          />
          <Title
            ref={titleRef}
            accessibilityRole="header"
            style={[styles.title, { color: theme.colors.primary }]}
          >
            Vous voilà prêt !
          </Title>

          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Grâce aux autorisations accordées, vous pourrez :
          </Text>

          <View style={styles.bulletPoints}>
            <View style={styles.bulletPoint}>
              <Ionicons
                name="hand-left"
                size={24}
                color={theme.colors.primary}
                style={styles.bulletIcon}
              />
              <Text
                style={[
                  styles.bulletText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Demander de l'aide si vous en avez besoin
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons
                name="notifications"
                size={24}
                color={theme.colors.primary}
                style={styles.bulletIcon}
              />
              <Text
                style={[
                  styles.bulletText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Être alerté des situations d'urgence autour de vous et apporter
                votre aide
              </Text>
            </View>
          </View>

          <Text
            style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}
          >
            À nous tous, nous faisons la différence ! 💪
          </Text>

          <CustomButton
            mode="contained"
            onPress={handleFinish}
            style={styles.button}
            color={theme.colors.primary}
          >
            Je suis prêt !
          </CustomButton>
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
  titleImage: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 30,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  bulletPoints: {
    width: "100%",
    marginBottom: 20,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  bulletIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 40,
    fontStyle: "italic",
  },
  button: {
    paddingHorizontal: 30,
  },
});

export default Success;
