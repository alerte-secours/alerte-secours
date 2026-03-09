export default [
  {
    level: "green",
    title: "enfants perdus",
    desc: "perte ou disparition d'enfant (très récente, gravité non confirmée)",
    // keywords: "",
  },
  {
    level: "green",
    title: "animaux perdus",
    desc: "perte ou disparation d'animaux",
  },
  {
    level: "green",
    title: "solidarité localisée de l'instant",
    desc: "détresse quotidienne sans gravité (panne de voiture, dégât des eaux…)",
  },
  {
    level: "yellow",
    title: "je suis perdu en nature",
    desc: "égarement en nature (zone montagneuse, forestière…)",
  },
  {
    level: "yellow",
    title: "personne fragile perdue",
    desc: "disparition de personne fragile: handicap mental, sénilité, Alzheimer...",
  },
  {
    level: "yellow",
    title: "dommages matériels",
    desc: "effraction, vols, destruction de biens publics, vandalisme",
  },
  {
    level: "yellow",
    title: "violence",
    desc: "bagarre, violence physique et verbale, domestique ou de rue",
  },
  {
    level: "yellow",
    title: "urgence médicale",
    desc: "empoisonnement, intoxication, fractures, chute avec désorientation, insolation, personne étendue inconsciente sur la voie publique",
  },
  {
    level: "yellow",
    title: "accident de véhicule",
    desc: "accident de voiture, de train, d'avion, de bateau, de parapente",
    // keywords: "routier, ferroviaire, aérien, maritime, engins volants",
  },
  {
    level: "yellow",
    title: "zone de catastrophe",
    desc: "zone de catastrophe (naturelle, industrielle, chimique…)",
  },
  {
    level: "yellow",
    title: "incendie",
    desc: "incendie de domicile, de forêt, propagation du feu",
  },
  {
    level: "red",
    title: "urgence médicale mortelle",
    desc: "crise cardiaque, attaque cérébrale, hémorragie importante, blessure grave",
  },
  {
    level: "red",
    title: "intoxication ou empoisonnement grave",
    desc: "ingestion de produit toxique, overdose, morsure de serpent…",
  },
  {
    level: "red",
    title: "violence avec blessures",
    desc: "agression violente, coups et blessures graves",
  },
  {
    level: "red",
    title: "agression à l'arme blanche",
    desc: "agression au couteau ou autre arme blanche",
  },
  {
    level: "red",
    title: "agression à l'arme à feu",
    desc: "agression au pistolet, fusil ou autre arme à feu",
  },
  {
    level: "red",
    title: "terrorisme",
    desc: "attentat, attaque kamikaze",
  },
  {
    level: "red",
    title: "affrontements armés",
    desc: "affrontement armé entre gangs",
  },
  {
    level: "red",
    title: "enlèvement",
    desc: "enlèvement constaté avec violence et coercition",
  },
  {
    level: "red",
    title: "viol",
    desc: "viol (ou tentative de viol)",
  },
  {
    level: "red",
    title: "disparition d'enfant",
    desc: "disparition d'enfant en bas âge confirmée",
  },
  {
    level: "red",
    title: "détresse lors d'un accouchement",
    desc: "difficultés médicales lors d'un accouchement hors contexte médicalisé",
  },
  {
    level: "red",
    title: "suicide",
    desc: "tentative de suicide",
  },
  {
    level: "red",
    title: "incendie avec péril mortel",
    desc: "incendie avec personne piégé par le feu",
  },
].map((item, index) => ({
  ...item,
  id: index.toString(),
}));
