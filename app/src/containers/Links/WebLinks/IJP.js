import WebButton from "~/components/Links/WebButton";
export default function WebLinkIJP() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-ijp.png")}
      // label="Info Jeunes Prostitution"
      description="Prévenir les pratiques prostitutionnelles et préprostitutionnelles chez les jeunes"
      url="https://infojeunesprostitution.fr/"
    />
  );
}
