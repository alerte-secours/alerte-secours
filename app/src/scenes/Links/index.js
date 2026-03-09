import React from "react";
import { View, ScrollView } from "react-native";
import { Title } from "react-native-paper";
import { createStyles } from "~/theme";

import Text from "~/components/Text";

import AppLinkPremiersSecours from "~/containers/Links/AppLinks/PremiersSecours";
import AppLink114 from "~/containers/Links/AppLinks/114";
import AppLinkStayingAlive from "~/containers/Links/AppLinks/StayingAlive";
import AppLinkSauvLife from "~/containers/Links/AppLinks/SauvLife";
import AppLinkFeuxDeForets from "~/containers/Links/AppLinks/FeuxDeForets";
import AppLinkGoodSam from "~/containers/Links/AppLinks/GoodSam";
import AppLinkUmay from "~/containers/Links/AppLinks/Umay";
import AppLinkTheSorority from "~/containers/Links/AppLinks/TheSorority";
import AppLinkMaSecurite from "~/containers/Links/AppLinks/MaSecurite";
import AppLink3117 from "~/containers/Links/AppLinks/3117";
import WebLinkLDA from "~/containers/Links/WebLinks/LDA";
import WebLinkCitoyenSauveteur from "~/containers/Links/WebLinks/CitoyenSauveteur";
import WebLinkBenevoleCroixRouge from "~/containers/Links/WebLinks/BenevoleCroixRouge";
import WebLinkSPV from "~/containers/Links/WebLinks/SPV";
import WebLinkReserviste from "~/containers/Links/WebLinks/Reserviste";
import WebLinkJeVeuxAider from "~/containers/Links/WebLinks/JeVeuxAider";
import WebLinkOUR from "~/containers/Links/WebLinks/OUR";
import WebLinkCarl from "~/containers/Links/WebLinks/Carl";
import WebLinkAquila from "~/containers/Links/WebLinks/Aquila";
import WebLinkEmerga from "~/containers/Links/WebLinks/Emerga";
import WebLinkDeltaPlane from "~/containers/Links/WebLinks/DeltaPlane";
import WebLinkDroguesInfoService from "~/containers/Links/WebLinks/DroguesInfoService";
import WebLinkIJP from "~/containers/Links/WebLinks/IJP";
import WebLinkAppuiSoutien from "~/containers/Links/WebLinks/AppuiSoutien";

export default function Links() {
  const styles = useStyles();

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Title style={styles.title}>Applications</Title>
        <View style={styles.section}>
          <AppLinkPremiersSecours />
          <AppLink114 />
          <AppLinkStayingAlive />
          <AppLinkSauvLife />
          <AppLinkFeuxDeForets />
          <AppLinkGoodSam />
          <AppLinkUmay />
          <AppLinkTheSorority />
          <AppLinkMaSecurite />
          <AppLink3117 />
          <WebLinkEmerga />
        </View>
        <Title style={styles.title}>Demander de l'aide</Title>
        <View style={styles.section}>
          <WebLinkLDA />
          <WebLinkCarl />
          <WebLinkIJP />
          <WebLinkDroguesInfoService />
          <WebLinkDeltaPlane />
          <WebLinkAppuiSoutien />
        </View>
        <Title style={styles.title}>S'engager</Title>
        <View style={styles.section}>
          <WebLinkCitoyenSauveteur />
          <WebLinkBenevoleCroixRouge />
          <WebLinkSPV />
          <WebLinkReserviste />
          <WebLinkJeVeuxAider />
          <WebLinkAquila />
          <WebLinkOUR />
        </View>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Si votre association ou organisation n'apparait pas dans la liste et
            que vous pensez qu'elle y a pourtant sa place, contactez-nous à
            l'adresse email contact@alertesecours.fr et votre demande sera
            examinée :-)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles(({ wp, hp, scaleText, theme: { colors } }) => ({
  scrollView: { flex: 1, paddingVertical: 15, paddingHorizontal: 15 },
  container: {
    flexDirection: "column",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    width: "100%",
    textAlign: "center",
  },
  section: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  disclaimer: {
    marginVertical: 60,
    marginHorizontal: 10,
  },
  disclaimerText: {
    fontSize: 20,
    textAlign: "justify",
  },
}));
