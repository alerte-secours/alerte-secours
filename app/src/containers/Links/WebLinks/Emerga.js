import WebButton from "~/components/Links/WebButton";
export default function WebLinkEmerga() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-emerga.png")}
      label="Emerga"
      // description="Application de gestion de crise et d'urgence."
      description="EmerGa se base sur l'intelligence artificielle pour vous aider à prendre en charge la victime d'un incident urgent."
      url="https://emerga.fr/application"
    />
  );
}
