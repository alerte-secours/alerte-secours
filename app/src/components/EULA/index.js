import React from "react";
import { View, ScrollView, StyleSheet, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "~/storage/memoryAsyncStorage";
import { STORAGE_KEYS } from "~/storage/storageKeys";
import { useTheme } from "~/theme";

import CustomButton from "~/components/CustomButton";
import Text from "~/components/Text";

const EULA_TEXT = `Contrat de Licence Utilisateur Final (CLUF)

Dernière mise à jour : 26/11/2024

1. Acceptation des Conditions
En téléchargeant, installant ou utilisant l'application Alerte-Secours ("Application"), vous acceptez d'être lié par ce Contrat de Licence Utilisateur Final ("Contrat"). Si vous n'acceptez pas les termes de ce Contrat, n'utilisez pas l'Application.

2. Octroi de Licence
Nous ("Alerte-Secours", "nous", "notre") vous accordons une licence personnelle, non exclusive, non transférable et limitée pour utiliser l'Application exclusivement à des fins personnelles et non commerciales, strictement conformément aux termes de ce Contrat.

3. Description des Services
L'Application utilise les services de localisation, notamment en arrière-plan, pour :
  - Notifier les Utilisateurs : Permettre aux utilisateurs de recevoir des notifications lorsque quelqu'un à proximité demande de l'aide.
  - Faciliter la Communication d'Urgence : Permettre aux utilisateurs en détresse de contacter les services d'urgence européens en :
    - Effectuant un appel téléphonique au numéro d'urgence 112.
    - Envoyant un SMS contenant des informations de localisation au numéro d'urgence 114 pour les personnes malentendantes ou ayant des difficultés à parler.

4. Clause de Non-Responsabilité concernant les Services d'Urgence
Aucune Garantie de Réponse des Services d'Urgence : Nous ne garantissons pas que les services d'urgence recevront ou répondront aux appels ou messages effectués via l'Application.
Exactitude des Informations de Localisation : Bien que l'Application s'efforce de fournir des données de localisation précises, nous ne garantissons ni leur exactitude ni que les services d'urgence pourront les interpréter correctement.
Pas un Substitut au Contact Direct : L'Application est conçue pour faciliter la communication mais ne remplace pas le contact direct avec les services d'urgence. En cas d'urgence, les utilisateurs doivent tenter de contacter directement les services d'urgence dans la mesure du possible.
Services de Tiers : Nous ne sommes pas responsables de la disponibilité ou du bon fonctionnement des services d'urgence contactés via l'Application.

5. Responsabilités de l'Utilisateur
Conformité aux Lois : Vous acceptez d'utiliser l'Application en conformité avec toutes les lois et réglementations applicables.
Informations Précises : Vous êtes responsable de vous assurer que toutes les informations que vous fournissez, y compris les données de localisation, sont exactes et à jour.
Fonctionnalité de l'Appareil : Vous êtes responsable de vous assurer que votre appareil est fonctionnel et dispose d'une connectivité adéquate pour utiliser les fonctionnalités de l'Application.

6. Politique de Confidentialité
Votre utilisation de l'Application est également régie par notre Politique de Confidentialité, qui est incorporée par référence dans ce Contrat.

7. Droits de Propriété Intellectuelle
Tous les droits, titres et intérêts relatifs à l'Application, y compris, mais sans s'y limiter, les graphismes, l'interface utilisateur, les scripts et les logiciels utilisés pour mettre en œuvre l'Application, nous appartiennent. Vous acceptez de ne pas modifier, louer, prêter, vendre, distribuer ou créer des œuvres dérivées basées sur l'Application.

8. Limitation de Responsabilité
Dans les limites maximales permises par la loi applicable :
  - Dommages Indirects : Nous ne serons pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, y compris la perte de profits, de données ou autres pertes intangibles.

9. Exclusion de Garanties
L'Application est fournie "EN L'ÉTAT" et "SELON DISPONIBILITÉ". Nous déclinons expressément toute garantie de quelque nature que ce soit, expresse ou implicite, y compris, mais sans s'y limiter, les garanties de qualité marchande, d'adéquation à un usage particulier et de non-contrefaçon.

10. Modifications de l'Application
Nous nous réservons le droit de modifier, suspendre ou interrompre, temporairement ou définitivement, l'Application ou tout service auquel elle est connectée, avec ou sans préavis et sans responsabilité envers vous.

11. Durée et Résiliation
Ce Contrat restera en vigueur jusqu'à sa résiliation par vous ou par nous. Nous pouvons résilier ou suspendre votre accès à l'Application à tout moment, sans préavis ni responsabilité, pour quelque raison que ce soit.

12. Droit Applicable
Ce Contrat est régi et interprété conformément aux lois de France, sans égard aux dispositions relatives aux conflits de lois.

13. Divisibilité
Si une disposition de ce Contrat est jugée inapplicable ou invalide, cette disposition sera modifiée et interprétée pour atteindre les objectifs de cette disposition dans la mesure maximale possible en vertu de la loi applicable.

14. Intégralité du Contrat
Ce Contrat constitue l'intégralité de l'accord entre vous et nous concernant l'utilisation de l'Application et remplace tous les accords antérieurs.

15. Coordonnées
Si vous avez des questions concernant ce Contrat, veuillez nous contacter à :
Email : contact@alertesecours.fr`;

const EULA = ({ onAccept, visible = true }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible || Platform.OS !== "ios") return null;

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EULA_ACCEPTED, "true");
      onAccept();
    } catch (error) {
      console.error("Error saving EULA acceptance:", error);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => {}}
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
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Conditions Générales
          </Text>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.text, { color: theme.colors.onSurface }]}>
              {EULA_TEXT}
            </Text>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <CustomButton mode="contained" onPress={handleAccept}>
              Accepter
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
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollViewContent: {
    paddingBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 12,
  },
});

export default EULA;
