import React from "react";

import Maplibre from "@maplibre/maplibre-react-native";

import markerRed from "~/assets/img/marker-red.png";
import markerYellow from "~/assets/img/marker-yellow.png";
import markerGreen from "~/assets/img/marker-green.png";
import markerGrey from "~/assets/img/marker-grey.png";
import markerRedDisabled from "~/assets/img/marker-red-disabled.png";
import markerYellowDisabled from "~/assets/img/marker-yellow-disabled.png";
import markerGreenDisabled from "~/assets/img/marker-green-disabled.png";
import markerOrigin from "~/assets/img/marker-origin.png";
import markerDae from "~/assets/img/marker-dae.png";
import markerPolice from "~/assets/img/marker-police.png";
import markerGendarmerie from "~/assets/img/marker-gendarmerie.png";
import markerUrgences from "~/assets/img/marker-urgence.png";
import markerHopital from "~/assets/img/marker-hopital.png";
import markerAngela from "~/assets/img/marker-angela.png";

const images = {
  red: markerRed,
  yellow: markerYellow,
  green: markerGreen,
  grey: markerGrey,
  redDisabled: markerRedDisabled,
  yellowDisabled: markerYellowDisabled,
  greenDisabled: markerGreenDisabled,
  origin: markerOrigin,
  dae: markerDae,
  police: markerPolice,
  gendarmerie: markerGendarmerie,
  urgences: markerUrgences,
  hopital: markerHopital,
  angela: markerAngela,
};

export default function FeatureImages() {
  return <Maplibre.Images images={images} />;
}
