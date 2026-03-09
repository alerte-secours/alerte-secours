import AppButton from "~/components/Links/AppButton";
export default function AppLinkFeuxDeForets() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-feuxdeforets.png")}
      label="Feux de Forêts"
      description="Feux de Forêt est la 1ère communauté francophone dédiée à la lutte contre les feux de forêts et d’espaces naturels"
      app={{
        appName: "feux-de-forêt",
        appStoreId: "1211866961",
        playStoreId: "com.montardy.feuxdeforet",
      }}
    />
  );
}
