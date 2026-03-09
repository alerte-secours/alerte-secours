import AppButton from "~/components/Links/AppButton";
export default function AppLinkPremiersSecours() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-premiersecours.png")}
      label="Premiers Secours"
      description="Les gestes de premiers secours lors d’une situation d’urgence. Accidents routiers ou de la vie courante, risques naturels, maladie, etc. De nombreuses situations sont répertoriées dans l’application avec des explications et des étapes à suivre pour agir en quelques secondes et venir en aide à la victime."
      // url="https://piroi.croix-rouge.fr/une-application-mobile-dediee-aux-premiers-secours/"
      app={{
        appName: "first-aid-ifrc",
        appStoreId: "id1312876691",
        playStoreId: "com.cube.gdpc.fa",
      }}
    />
  );
}
