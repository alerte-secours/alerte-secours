import WebButton from "~/components/Links/WebButton";
export default function WebLinkDroguesInfoService() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-drogues-info-service.png")}
      label="Drogues Info Service"
      description="Service national d'information et de prévention sur les drogues et les dépendances."
      url="https://www.drogues-info-service.fr/"
    />
  );
}
