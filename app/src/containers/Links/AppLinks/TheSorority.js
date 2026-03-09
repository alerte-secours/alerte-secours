import AppButton from "~/components/Links/AppButton";
export default function AppLinkTheSorority() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-the-sorority.png")}
      label="The Sorority"
      description="L'application la + utilisée et la + sécurisée face aux situations de violence, d'harcèlement et d'insécurité."
      app={{
        appName: "the-sorority",
        appStoreId: "1503074714",
        playStoreId: "com.thesorority",
      }}
    />
  );
}
