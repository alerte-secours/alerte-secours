import AppButton from "~/components/Links/AppButton";
export default function AppLinkSauvLife() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-sauvlife.png")}
      // label="SAUV Life"
      description="met à disposition des citoyens les outils et les connaissances nécessaires pour agir rapidement et efficacement en cas d’arrêt cardiaque. Rejoignez des centaines de milliers de volontaires !"
      app={{
        appName: "sauv-life",
        appStoreId: "1300041231",
        playStoreId: "com.sauvlife.app",
      }}
    />
  );
}
