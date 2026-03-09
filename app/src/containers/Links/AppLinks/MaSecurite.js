import AppButton from "~/components/Links/AppButton";
export default function AppLinkUmay() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-masecurite.png")}
      label="Ma Sécurité"
      description="Chaque citoyen, Français ou étranger, peut échanger par tchat avec un policier ou un gendarme 24/7."
      app={{
        appName: "ma-sécurité",
        appStoreId: "1606413246",
        playStoreId: "com.masecuriteapp",
      }}
    />
  );
}
