import AppButton from "~/components/Links/AppButton";
export default function AppLinkGoodSam() {
  return (
    <AppButton
      logo={require("~/assets/img/links/logo-goodsam.png")}
      label="GoodSam"
      description="Utilisé par les services d'urgence du monde entier, GoodSAM connecte les professionnels formés en réanimation (ambulanciers, infirmières, médecins, policiers, pompiers) avec les personnes en urgence médicale à proximité."
      app={{
        appName: "goodsam-responder",
        appStoreId: "id815154202",
        playStoreId: "com.goodsam.responder",
      }}
    />
  );
}
