import AppButton from "~/components/Links/AppButton";
export default function AppLinkUmay() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-umay.png")}
      // label="Umay"
      description="Avec UMAY, Informe tes proches de ton parcours en temps réel, en cas de harcèlement ou d’agression, trouve refuge dans l’une de nos 6500 safe places partout en France et visualise en direct les dangers et alertes autour de toi signalées pas les autres utilisateurs."
      app={{
        appName: "garde-ton-corps",
        appStoreId: "1454634994",
        playStoreId: "com.gardetoncorps.android",
      }}
    />
  );
}
