import React from "react";
import WebButton from "~/components/Links/WebButton";

export default function WebLinkOUR() {
  return (
    <WebButton
      logo={require("~/assets/img/links/logo-ourrescue.png")}
      label="O.U.R Rescue"
      description="Nous menons la lutte contre l'exploitation sexuelle des enfants et la traite des êtres humains dans le monde entier. Rejoignez la lutte."
      url="https://ourrescue.org/join-the-fight"
    />
  );
}
