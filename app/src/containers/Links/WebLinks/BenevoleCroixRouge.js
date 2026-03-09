import WebButton from "~/components/Links/WebButton";
export default function WebLinkBenevoleCroixRouge() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-croixrouge.png")}
      label="Croix Rouge"
      description="Devenir bénévole à la Croix-Rouge"
      url="https://www.croix-rouge.fr/je-deviens-benevole"
    />
  );
}
