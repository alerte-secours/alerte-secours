import React from "react";
import {
  View,
  ScrollView,
  Linking,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import Text from "~/components/Text";

import { createStyles, useTheme } from "~/theme";

const openURL = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erreur", "Impossible d'ouvrir ce lien");
    }
  } catch (error) {
    Alert.alert(
      "Erreur",
      "Une erreur s'est produite lors de l'ouverture du lien",
    );
  }
};

export default function Contribute() {
  const styles = useStyles();
  const { colors } = useTheme();

  const donateAllowed = Platform.OS === "ios";

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="favorite" size={28} color={colors.primary} />
          <Text style={styles.title}>Contribuer au projet</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Alerte-Secours est une application citoyenne d'intérêt général, elle
          est gratuite, sans publicité ni exploitation de données.
          {"\n"}
          {donateAllowed
            ? `Si vous souhaitez contribuer à son développement, sa maintenance et son indépendance :`
            : ""}
        </Text>

        <View style={styles.donationSection}>
          {donateAllowed ? (
            <>
              <Text style={styles.sectionTitle}>Soutenir le projet</Text>
              {/* Liberapay Button */}
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.donationButton,
                  styles.buttonContent,
                  styles.liberapayButton,
                ]}
                onPress={() => openURL("https://liberapay.com/alerte-secours")}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="circle" style={styles.iconDonation} />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>
                    Liberapay – Soutien régulier
                  </Text>
                  <Text style={styles.buttonDescription}>
                    Pour un soutien récurrent et engagé. Chaque don contribue à
                    assurer la stabilité du service sur le long terme.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Buy Me a Coffee Button */}
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.donationButton,
                  styles.buttonContent,
                  styles.buymeacoffeeButton,
                ]}
                onPress={() =>
                  openURL("https://buymeacoffee.com/alertesecours")
                }
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="local-cafe"
                    style={styles.iconDonation}
                  />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>
                    Buy Me a Coffee – Don ponctuel
                  </Text>
                  <Text style={styles.buttonDescription}>
                    Pour un coup de pouce ponctuel, un café virtuel pour
                    encourager le travail accompli !
                  </Text>
                </View>
              </TouchableOpacity>

              {/* GitHub Sponsors Button */}
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.donationButton,
                  styles.buttonContent,
                  styles.githubButton,
                ]}
                onPress={() =>
                  openURL("https://github.com/sponsors/alerte-secours")
                }
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <AntDesign name="github" style={styles.iconDonation} />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>GitHub Sponsors</Text>
                  <Text style={styles.buttonDescription}>
                    Pour les développeurs et utilisateurs de GitHub : soutenez
                    le projet directement via votre compte.
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Collaboration Section */}
        <View style={styles.collaborationSection}>
          <Text style={styles.collaborationTitle}>
            Vous souhaitez nous rejoindre
          </Text>
          <Text style={styles.collaborationDescription}>
            Ce projet fait sens pour vous et vous souhaitez vous engager dans un
            projet d'avenir ?{"\n\n"}
            Alerte-Secours est à la recherche de collaborateurs avec des
            compétences dans le développement, la gestion de projet, le
            business, la com, le graphisme. Contactez-nous si vous souhaitez
            faire partie de l'aventure.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.contactButton}
            onPress={() => openURL("mailto:contact@alertesecours.fr")}
            activeOpacity={0.8}
          >
            <MaterialIcons name="email" style={styles.contactIcon} />
            <Text style={styles.contactText}>contact@alertesecours.fr</Text>
          </TouchableOpacity>
          {!donateAllowed && (
            <Text style={styles.supportFooterText}>
              Vous pouvez aussi nous soutenir financièrement, pour en savoir
              plus, rendez-vous sur notre site{" "}
              <Text
                style={styles.linkText}
                onPress={() => openURL("https://alerte-secours.fr")}
              >
                alerte-secours.fr
              </Text>
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles(({ theme: { colors, custom } }) => ({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginLeft: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.onBackground,
    marginBottom: 0,
    textAlign: "left",
  },
  donationButton: {
    marginVertical: 10,
    borderRadius: 16,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonContent: {
    minHeight: 64,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "left",
    marginBottom: 4,
    color: custom.donation.onDonation,
  },
  buttonDescription: {
    fontSize: 14,
    opacity: 0.9,
    textAlign: "left",
    lineHeight: 20,
    color: custom.donation.onDonation,
  },
  iconContainer: {
    marginRight: 18,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  // Icon styles
  iconDonation: {
    fontSize: 22,
    color: custom.donation.onDonation,
  },
  // Button background styles
  liberapayButton: {
    backgroundColor: custom.donation.liberapay,
  },
  buymeacoffeeButton: {
    backgroundColor: custom.donation.buymeacoffee,
  },
  githubButton: {
    backgroundColor: custom.donation.github,
  },
  // Android support link (no CTA styling)
  androidSupportContainer: {
    marginVertical: 8,
    marginBottom: 24,
    paddingVertical: 8,
  },
  androidSupportText: {
    fontSize: 15,
    color: colors.primary,
    textAlign: "left",
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
  supportFooterText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  // Donation section
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 12,
    marginBottom: 12,
  },
  donationSection: {
    marginBottom: 24,
  },
  // Collaboration section styles
  collaborationSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  collaborationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  collaborationDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    marginBottom: 20,
    textAlign: "left",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactIcon: {
    fontSize: 20,
    color: colors.onPrimary,
    marginRight: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onPrimary,
  },
}));
