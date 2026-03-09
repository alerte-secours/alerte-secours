import WebButton from "~/components/Links/WebButton";
export default function WebLinkCitoyenSauveteur() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-stayingalive-short.png")}
      label="Devenir Citoyen Sauveteur"
      description="Que vous soyez formé ou non aux gestes de premiers secours vous pouvez sauver une vie."
      url="https://stayingalive.org/citoyen-sauveteur/"
    />
  );
}
