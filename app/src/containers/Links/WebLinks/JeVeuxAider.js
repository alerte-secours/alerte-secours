import WebButton from "~/components/Links/WebButton";
export default function WebLinkJeVeuxAider() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-jeveuxaider.png")}
      // label=""
      description="Plateforme de bénévolat du service public"
      url="https://www.jeveuxaider.gouv.fr/"
    />
  );
}
