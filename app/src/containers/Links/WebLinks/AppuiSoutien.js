import WebButton from "~/components/Links/WebButton";

export default function WebLinkAppuiSoutien() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-appui-soutien.png")}
      label="Appui Soutien – Montjean (16)"
      description="Véhicule d’appui bénévole pour les petites communes dans un rayon d’environ 30 km autour de Montjean (16240) : renfort aux secours, dégagement de la voie publique, soutien logistique et aux sinistrés. Astreinte : 06 84 38 16 31."
      tel="+33684381631"
    />
  );
}
