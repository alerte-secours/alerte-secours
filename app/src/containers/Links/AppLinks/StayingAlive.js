import AppButton from "~/components/Links/AppButton";
export default function AppLinkStayingAlive() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-stayingalive.png")}
      // label="Staying Alive"
      description="En cas d’arrêt cardiaque, il est essentiel de commencer la réanimation sans attendre, afin de préserver les chances de survie de la victime."
      app={{
        appName: "staying-alive",
        appStoreId: "403117516",
        playStoreId: "com.mobilehealth.cardiac",
      }}
    />
  );
}
