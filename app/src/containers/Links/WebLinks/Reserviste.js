import WebButton from "~/components/Links/WebButton";
export default function WebLinkReserviste() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-rf.png")}
      label="Devenir Réserviste"
      description="Devenir réserviste du service public"
      url="https://www.info.gouv.fr/risques/devenir-reserviste"
    />
  );
}
