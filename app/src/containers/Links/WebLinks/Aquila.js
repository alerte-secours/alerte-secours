import WebButton from "~/components/Links/WebButton";
export default function WebLinkAquila() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-aquila.png")}
      label="Association Aquila"
      description="Mouvement associatif de protection des enfants contre toutes formes de violences notamment sexuelle."
      url="http://association-aquila.com/"
    />
  );
}
