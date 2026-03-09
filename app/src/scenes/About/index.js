import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import * as Updates from "expo-updates";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons, AntDesign, FontAwesome } from "@expo/vector-icons";
import Text from "~/components/Text";

import { useTheme, createStyles } from "~/theme";

import { paramsActions, useParamsState } from "~/stores";

import { useUpdatesCheck } from "~/updates";

const logo = require("~/assets/img/logo192.png");

const version = require("../../../package.json").version;

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

export default function About() {
  const navigation = useNavigation();
  const textStyle = {
    textAlign: "left",
    fontSize: 16,
    paddingVertical: 5,
    paddingHorizontal: 15,
  };
  const { colors } = useTheme();

  const [pressCount, setPressCount] = useState(0);

  const { devModeEnabled } = useParamsState(["devModeEnabled"]);

  const handlePressVersion = useCallback(() => {
    if (pressCount === 0) {
      setTimeout(() => {
        setPressCount(0);
      }, 30000);
    }
    setPressCount((prevCount) => prevCount + 1);
  }, [setPressCount, pressCount]);

  useEffect(() => {
    if (pressCount >= 8) {
      paramsActions.setDevModeEnabled(true);
    }
  }, [pressCount]);

  const { currentlyRunning } = Updates.useUpdates();

  const { updateAvailable } = useUpdatesCheck();

  const runTypeMessage = currentlyRunning.isEmbeddedLaunch
    ? "fonctionne à partir d'un code intégré"
    : "fonctionne à partir d'une mise à jour";

  const [checking, setChecking] = useState(false);
  const checkForUpdates = async () => {
    setChecking(true);
    await Updates.checkForUpdateAsync();
    setChecking(false);
  };

  return (
    <ScrollView
      style={{
        flex: 1,
      }}
    >
      <View
        style={{
          flex: 1,
          padding: 15,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <View style={{}}>
          <View style={{ width: "100%", alignItems: "center" }}>
            <Image style={{ width: 64, height: 64 }} source={logo} />
          </View>
          <View>
            <Text style={textStyle}>
              🚨 <Text style={{ fontWeight: "bold" }}>Alerte-Secours</Text> est
              bien plus qu'une simple application mobile. C'est un réseau
              d'entraide et de soutien qui vous accompagne partout, prêt à
              réagir instantanément en cas d'urgence. Que vous soyez confronté à
              une situation critique ou que vous ayez besoin d'aide rapidement,{" "}
              <Text style={{ fontWeight: "bold" }}>Alerte-Secours</Text> est là
              pour vous.
            </Text>
            <Text style={textStyle}>
              🆘 <Text style={{ fontWeight: "bold" }}>En quelques gestes</Text>,
              vous pouvez déclencher une alerte et prévenir vos proches, les
              utilisateurs à proximité grâce à la géolocalisation, et même les
              services de secours. Qu'il s'agisse d'un danger immédiat, d'une
              urgence médicale, ou simplement d'une situation nécessitant de
              l'aide, l'application est conçue pour agir rapidement et
              efficacement.
            </Text>
            <Text style={textStyle}>
              🔵{" "}
              <Text style={{ fontWeight: "bold" }}>Trois niveaux d'alerte</Text>{" "}
              adaptés à chaque situation : de l'urgence vitale nécessitant une
              intervention immédiate aux besoins d'entraide locale. Chaque
              niveau est identifiable grâce à un code couleur simple et clair,
              facilitant une réponse appropriée et coordonnée.
            </Text>
            <Text style={textStyle}>
              🤝 <Text style={{ fontWeight: "bold" }}>Plus qu'une alerte</Text>,
              c'est un appel à la solidarité et à la mobilisation de tous.
              Lorsque vous envoyez une alerte, vous créez un espace de
              communication en temps réel, permettant à ceux qui sont à
              proximité de partager des informations cruciales et de coordonner
              leur intervention. Que vous soyez un professionnel des secours ou
              simplement quelqu'un prêt à aider, chaque geste compte.
            </Text>
            <Text style={textStyle}>
              📍 Avec <Text style={{ fontWeight: "bold" }}>Alerte-Secours</Text>
              , restez connecté et prêt à intervenir. L'application vous guide
              grâce à un système de géoguidance intégré qui vous dirige vers
              l'incident sans quitter l'application. Vous pouvez aussi choisir
              d'utiliser votre application de navigation préférée, comme Google
              Maps ou Waze.
            </Text>
            <Text style={textStyle}>
              🔔 <Text style={{ fontWeight: "bold" }}>Rejoignez-nous</Text> et
              faites partie d'une communauté qui veille les uns sur les autres.
              En téléchargeant{" "}
              <Text style={{ fontWeight: "bold" }}>Alerte-Secours</Text>, vous
              contribuez à rendre votre environnement plus sûr, pour vous et
              pour les autres. Ensemble, nous pouvons faire la différence et
              sauver des vies.
            </Text>
            <Text style={textStyle}>
              🌍 <Text style={{ fontWeight: "bold" }}>Soyez le lien vital</Text>{" "}
              dont votre prochain a besoin. Grâce à{" "}
              <Text style={{ fontWeight: "bold" }}>Alerte-Secours</Text>, chaque
              citoyen peut jouer un rôle clé dans les moments critiques,
              renforçant ainsi l'entraide et la sécurité collective. Parce qu'en
              cas d'urgence, chaque seconde, chaque action, et chaque personne
              compte !
            </Text>
            <Text style={textStyle}>
              ⚠️ L'application Alerte-Secours n'est pas une application
              officielle du gouvernement ni d'aucune agence gouvernementale.
              Elle ne représente aucune entité gouvernementale et ne doit pas
              être utilisée comme une source unique d'informations ou de
              conseils en cas d'urgence. Alerte-Secours est une application de
              soutien communautaire destinée à faciliter l'entraide et à
              améliorer la communication en cas de situations critiques. Pour
              des informations officielles et des directives spécifiques,
              veuillez vous référer aux sites web et aux services des autorités
              compétentes.
            </Text>
          </View>
        </View>

        {/* Website and Contribute Buttons */}
        <View style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
          {/* Website Button */}
          <TouchableOpacity
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 10,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => openURL("https://alerte-secours.fr")}
          >
            <MaterialIcons
              name="language"
              size={24}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: colors.onSurface,
                fontSize: 16,
                fontWeight: "bold",
                marginLeft: 5,
              }}
            >
              Site officiel
            </Text>
          </TouchableOpacity>

          {/* Contribute Button */}
          <TouchableOpacity
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => navigation.navigate("Contribute")}
          >
            <MaterialIcons
              name="favorite"
              size={24}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: colors.onSurface,
                fontSize: 16,
                fontWeight: "bold",
                marginLeft: 5,
              }}
            >
              Contribuer au projet
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 15, justifyContent: "center" }}>
          <Button
            mode="text"
            icon={() => (
              <AntDesign name="rocket1" size={22} color={colors.primary} />
            )}
            onPress={handlePressVersion}
          >
            version {version} {updateAvailable || checking ? "" : "(à jour)"}
          </Button>
          {!updateAvailable && (
            <Button
              mode="contained"
              icon={() => (
                <MaterialIcons
                  name="update"
                  size={22}
                  color={colors.onPrimary}
                />
              )}
              style={{ backgroundColor: colors.primary }}
              onPress={checkForUpdates}
            >
              Vérifier les mises à jour
            </Button>
          )}
          {updateAvailable && (
            <Button
              mode="contained"
              icon={() => (
                <MaterialIcons
                  name="system-update"
                  size={22}
                  color={colors.onPrimary}
                />
              )}
              style={{ backgroundColor: colors.primary }}
              onPress={() => Updates.fetchUpdateAsync()}
            >
              Installer la mise à jour
            </Button>
          )}
          <StatusBar style="auto" />
          {devModeEnabled && (
            <View
              style={{
                paddingTop: 20,
                paddingBottom: 50,
                flexDirection: "column",
              }}
            >
              <View
                style={{
                  padding: 15,
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="developer-mode"
                  size={24}
                  color={colors.primary}
                />
                <Text style={{ color: colors.primary, paddingLeft: 5 }}>
                  developer mode enabled
                </Text>
              </View>
              <View
                style={{
                  paddingTop: 15,
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <FontAwesome
                  name={
                    currentlyRunning.isEmbeddedLaunch ? "codepen" : "code-fork"
                  }
                  size={24}
                  color={colors.primary}
                />
                <Text
                  style={{
                    color: colors.primary,
                    paddingLeft: 5,
                    fontSize: 16,
                  }}
                >
                  {runTypeMessage}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
