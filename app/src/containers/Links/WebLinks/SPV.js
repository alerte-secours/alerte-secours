import WebButton from "~/components/Links/WebButton";
export default function WebLinkSPV() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-sapeurspompiers.png")}
      label="Sapeurs-Pompiers"
      description="Devenir Sapeur-Pompier volontaire"
      // url="https://www.info.gouv.fr/actualite/devenir-sapeur-pompier-volontaire"
      url="https://www.pompiers.fr/tour-de-france-2023/renseignements/devenir-sapeur-pompier-volontaire-spv"
    />
  );
}
