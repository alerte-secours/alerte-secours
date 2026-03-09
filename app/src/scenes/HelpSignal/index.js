import React from "react";
import {
  View,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Title, Divider, Card } from "react-native-paper";
import { createStyles } from "~/theme";
import Text from "~/components/Text";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HelpSignal() {
  const styles = useStyles();

  const openArticle = () => {
    Linking.openURL(
      "https://ici.radio-canada.ca/ohdio/premiere/emissions/dans-la-mosaique/segments/entrevue/378287/geste-signe-main-detresse-femme-appel-aide-david-toto",
    );
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Title style={styles.title}>Signal d'appel à l'aide</Title>
        <Text style={styles.subtitle}>
          Un geste simple qui peut sauver des vies
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={require("~/assets/img/discret-signal-for-help/discret-signal-for-help.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                style={styles.cardIcon}
              />{" "}
              Qu'est-ce que c'est ?
            </Text>
            <Text style={styles.description}>
              Ce signal de la main permet de demander discrètement de l'aide
              lors d'une situation de détresse ou de danger, notamment dans les
              cas de violence domestique ou d'enlèvement, sans laisser de trace
              numérique.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment faire le geste</Text>
          <Text style={styles.description}>
            1. Montrez la paume de votre main face à la personne{"\n"}
            2. Repliez votre pouce vers la paume{"\n"}
            3. Refermez vos quatre autres doigts par-dessus le pouce
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quand l'utiliser</Text>
          <Text style={styles.description}>
            Ce signal peut être utilisé discrètement lors d'appels vidéo, dans
            un lieu public, ou dans toute situation où vous ne pouvez pas parler
            librement ou utiliser votre téléphone pour demander de l'aide. Vous
            seul(e) pouvez juger quand et où il est sécuritaire de l'utiliser.
          </Text>
        </View>

        <Card style={[styles.card, styles.highlightCard]}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              <MaterialCommunityIcons
                name="alert"
                size={20}
                style={styles.cardIcon}
              />{" "}
              Si vous voyez ce signal
            </Text>
            <Text style={styles.description}>
              Si quelqu'un vous fait ce geste :{"\n"}• Montrez discrètement que
              vous avez compris{"\n"}• Ne mettez pas la personne en danger
              supplémentaire{"\n"}• Laissez la personne vous indiquer comment
              l'aider{"\n"}• Si nécessaire, contactez les autorités (112, 17 ou
              15)
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Une histoire vraie</Text>
          <Text style={styles.description}>
            En 2021, une adolescente disparue de Caroline du Nord a été secourue
            après avoir utilisé ce signal de détresse. Depuis la voiture de son
            ravisseur, elle a fait ce geste à un automobiliste qui l'a reconnu
            et a alerté la police. Ce geste simple lui a probablement sauvé la
            vie.
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.linkContainer, styles.sectionLink]}
            onPress={openArticle}
          >
            <MaterialCommunityIcons
              name="web"
              size={24}
              style={styles.linkIcon}
            />
            <Text style={styles.linkText}>
              Lire l'article complet sur cette histoire
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles(({ wp, hp, theme: { colors } }) => ({
  scrollView: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  container: {
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    width: "100%",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 5,
    textAlign: "center",
    fontStyle: "italic",
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
  },
  image: {
    width: "100%",
  },
  card: {
    width: "100%",
    marginVertical: 5,
    backgroundColor: colors.surface,
  },
  highlightCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.primary,
  },
  cardIcon: {
    color: colors.primary,
  },
  section: {
    width: "100%",
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    textAlign: "justify",
    lineHeight: 24,
  },
  divider: {
    width: "100%",
    marginVertical: 20,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    width: "100%",
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 10,
    flex: 1,
  },
  linkIcon: {
    color: colors.primary,
  },
  sectionLink: {
    marginTop: 15,
    marginBottom: 0,
  },
  bottomSpace: {
    height: 40,
  },
}));
