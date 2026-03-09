export default () => {
  const list = [
    {
      color: "red",
      title: "urgence médicale mortelle",
    },
    {
      color: "red",
      title: "crise cardiaque",
    },
    {
      color: "red",
      title: "attaque cérébrale",
    },
    {
      color: "red",
      title: "hémorragie importante",
    },
    {
      color: "red",
      title: "blessure grave",
    },
    {
      color: "red",
      title: "overdose",
    },
    {
      color: "red",
      title: "piqure de serpent",
    },

    {
      color: "red",
      title: "agression violente",
    },
    {
      color: "red",
      title: "menace armée",
    },
    {
      color: "red",
      title: "coups violents",
    },
    {
      color: "red",
      title: "viol",
    },
    {
      color: "red",
      title: "individus armés",
    },
    {
      color: "red",
      title: "conflit armé",
    },
    {
      color: "red",
      title: "enlèvement ou disparation inquiétante",
    },
    {
      color: "red",
      title: "enlèvement d'enfants",
    },
    {
      color: "red",
      title: "disparition confirmée d'enfant",
    },
    {
      color: "red",
      // title: "Accouchement imminent ou en cours",
      title: "Problème lors d'un accouchement",
    },
    {
      color: "red",
      title: "Tentative de suicide",
    },
    {
      color: "red",
      title: "incendie",
    },

    {
      color: "yellow",
      title: "danger médical",
    },
    {
      color: "yellow",
      title: "empoisonnement",
    },
    {
      color: "yellow",
      title: "intoxication",
    },
    {
      color: "yellow",
      title: "fractures",
    },
    {
      color: "yellow",
      title: "chute avec désorientation",
    },
    {
      color: "yellow",
      title: "insolation",
    },

    {
      color: "yellow",
      title: "bagarre",
    },
    {
      color: "yellow",
      title: "bagarre violente domestique",
    },
    {
      color: "yellow",
      title: "bagarre de rue",
    },

    {
      color: "yellow",
      title: "affrontements",
    },
    {
      color: "yellow",
      title: "affrontement entre groupes criminels ou entre gangs rivaux",
    },
    {
      color: "yellow",
      title: "menaces, injures et intimidation",
    },
    {
      color: "yellow",
      title: "racket et extorsion",
    },

    {
      color: "yellow",
      title: "personne étendue inconsciente sur la voie publique",
    },
    {
      color: "yellow",
      title:
        "Disparition de personne atteinte de handicap mental, de sénilité ou d'alzheimer",
    },
    {
      color: "yellow",
      title: "accident de véhicule",
    },
    {
      color: "yellow",
      title: "accident ferroviaire",
    },
    {
      color: "yellow",
      title: "accident routier, de voiture, moto, poids-lourd ou autre",
    },
    {
      color: "yellow",
      title: "accident aérien, avion, parapente ou autre",
    },
    {
      color: "yellow",
      title: "accident maritime, bateau, voilier, surf ou autre",
    },

    {
      color: "yellow",
      title: "zone de catastrophe",
    },
    {
      color: "yellow",
      title: "catastrophe naturelle",
    },
    {
      color: "yellow",
      title: "catastrophe industriel",
    },
    {
      color: "yellow",
      title: "catastrophe chimique",
    },

    {
      color: "yellow",
      title: "je suis perdu en montagne ou en nature",
    },
    {
      color: "yellow",
      title: "vols",
    },
    {
      color: "yellow",
      title: "destruction de biens matériels",
    },
    {
      color: "yellow",
      title: "vandalisme",
    },

    {
      color: "green",
      title: "perte d'enfant très récente suite à une innatention",
    },
    {
      color: "green",
      title: "perte ou disparation d'animaux",
    },
    {
      color: "green",
      title: "panne de voiture",
    },
    {
      color: "green",
      title: "dégat des eaux",
    },
    {
      color: "green",
      title: "détresse domestique sans gravité vitale",
    },
  ];

  return list.map((item, index) => {
    return {
      ...item,
      key: index,
    };
  });
};
