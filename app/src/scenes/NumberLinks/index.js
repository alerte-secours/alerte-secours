import React from "react";
import { View, ScrollView } from "react-native";
import { Title } from "react-native-paper";
import { createStyles } from "~/theme";

import TelButton from "./TelButton";

export default function NumberLinks() {
  const styles = useStyles();

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.section}>
          <TelButton
            tel="112"
            label="en cas de situation urgente contactez plutôt le 112"
          />
        </View>
        <Title style={styles.title}>
          Numéros d'urgences, d'écoute, d'information et d'orientation
        </Title>
        <View style={styles.section}>
          <TelButton tel="17" label="Police secours" />
          <TelButton tel="18" label="Sapeurs-pompiers" />
          <TelButton tel="15" label="SAMU" description="secours médicaux" />
          <TelButton
            tel="114"
            label="SOS pour sourds et malentendants"
            description="Accessible par SMS uniquement, toutes urgences"
            mode="sms"
          />
          <TelButton
            tel="115"
            label="SAMU social"
            description="SOS Sans Abri"
          />
          <TelButton tel="116 000" label="Enfants disparus" />
          <TelButton
            tel="119"
            label="Enfance en danger"
            description="violences subies par les enfants (violences psychologiques, physiques et sexuelles), notamment au sein de la famille ou en institution. Le 119 est également contacté pour d’autres problématiques de dangers."
          />
          <TelButton
            tel="39 19"
            label="Violences Femmes Infos"
            description={
              "Numéro d’écoute gratuit destiné aux femmes victimes de violences, à leur entourage et aux professionnels concernés"
            }
          />
          <TelButton
            tel="0 800 05 95 95"
            label="SOS viols"
            description={
              "Numéro gratuit destiné aux femmes victimes de viol ou d’agressions sexuelles, à leur entourage et aux professionnels concernés."
            }
          />
          <TelButton tel="31 14" label="Prévention du Suicide" />
          <TelButton
            tel="0 806 23 10 63"
            label="Prévenir les actes de pédocriminalité"
            description={
              "S’adresse aux adultes attirés par les enfants et qui cherchent de l’aide pour éviter de passer à l’acte."
            }
          />
          <TelButton
            tel="08 019 019 11"
            label="Prévenir les violences"
            description="Numéro national de prévention destiné aux auteurs de violences"
          />
          <TelButton
            tel="0 800 00 56 96"
            label="Stop Djihadisme"
            description="Numéro gratuit pour signaler et alerter, protéger et accompagner les jeunes et leur famille"
          />
          <TelButton
            tel="39 28"
            label="Numéro unique de signalement des discriminations"
          />
          <TelButton tel="36 77" label="Animaux maltraités" />
          <TelButton tel="30 18" label="Harcèlement scolaire et en ligne" />

          <TelButton
            tel="116 006"
            label="Numéro d'aide aux victimes"
            description="Vous ou un proche êtes victimes de violences physiques, sexuelles ou psychologiques, au sein de la famille ou en dehors, d'un accident de la route, d'un vol ou d'une escroquerie, ou de n'importe quel autre fait qui vous a porté préjudice."
          />

          <TelButton
            tel="191"
            label="Urgence aéronautique"
            description="à utiliser dans le cas d'accident ou de disparition d'un aéronef"
          />
          <TelButton
            tel="196"
            label="Urgence maritime"
            description="à utiliser par des témoins d'accidents maritimes depuis le littoral ; en mer, le moyen privilégié reste le canal 16 de détresse maritime"
          />
          <TelButton
            tel="19711"
            label="Alerte enlèvement / attentats"
            description="ce numéro sera activé uniquement dans le cadre du déclenchement de l'alerte enlèvement, ou d'une alerte attentat"
          />
          <TelButton tel="0 800 121 123" label="Spéléo Secours Français" />
          <TelButton tel="116 117 10" label="Médecin de garde" />
          <TelButton
            tel="0 800 08 11 11"
            label="Sexualité / Contraception / IVG"
            description={
              "Numéro gratuit pour répondre à toutes les questions sur les sexualités, la contraception et l'IVG."
            }
          />
          <TelButton
            tel="0 800 23 13 13"
            label="Drogues Info Services"
            description="Service national d'information et de prévention sur les drogues et les dépendances."
          />
          <Title style={styles.title}>Centres Antipoison</Title>
          <TelButton tel="02 41 48 21 21" label="ANGERS" />
          <TelButton tel="05 56 96 40 80" label="BORDEAUX" />
          <TelButton tel="08 00 59 59 59" label="LILLE" />
          <TelButton tel="04 72 11 69 11" label="LYON" />
          <TelButton tel="04 91 75 25 25" label="MARSEILLE" />
          <TelButton tel="03 83 22 50 50" label="NANCY" />
          <TelButton tel="01 40 05 48 48" label="PARIS" />
          <TelButton tel="05 61 77 74 47" label="TOULOUSE" />
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
  disclaimer: {
    fontSize: 20,
    color: colors.danger,
    fontWeight: "bold",
    marginBottom: 25,
    paddingHorizontal: 30,
    width: "100%",
    textAlign: "center",
  },
  section: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
}));
