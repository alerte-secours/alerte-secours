import AppButton from "~/components/Links/AppButton";
export default function AppLink3117() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-3117.png")}
      label="Alerte 3117 (SNCF & RATP)"
      // description="Application permettant de signaler une situation à risque dans les transports SNCF et RATP."
      description="Le 31177 (SMS) ou 3117 (voix) est le numéro d’alerte accessible 24h/24 et 7j/7 sur l’ensemble du réseau ferré français pour signaler une situation dangereuse dont vous êtes victime ou témoin."
      app={{
        appName: "alerte-3117",
        appStoreId: "id1118896124",
        playStoreId: "com.milky.sncf_3117",
      }}
    />
  );
}
