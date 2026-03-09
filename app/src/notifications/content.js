import humanizeDistance from "~/lib/geo/humanizeDistance";
import levelLabel from "~/misc/levelLabel";
import kebabCase from "lodash.kebabcase";

const RELATIVE_PHONE_FALLBACK = "Numéro non disponible";

export const generateAlertContent = (data) => {
  const { code, level, initialDistance, reason } = data;

  const distance = humanizeDistance(initialDistance);
  const bodyClaimBegining =
    reason === "relative"
      ? "Un de vos proches a besoin d'aide"
      : "Demande d'aide à proximité";
  const bodyClaim = `${bodyClaimBegining} - ${levelLabel[level]}`;
  const text = `${bodyClaim} à ${distance}`;
  const bigText = `${bodyClaim} à ${distance}`;

  return {
    title: `Nouvelle Alerte`,
    body: text,
    bigText,
    code,
  };
};

export const generateAlertEmergencyInfoContent = (data) => {
  const {
    code,
    what3words = "Non disponible",
    address = "Non disponible",
    nearestPlace = "Non disponible",
  } = data;

  const localisationText = `Localisation en 3 mots: ${what3words}.\nAdresse: ${address}.\nÀ proximité de: ${nearestPlace}.`;
  const text = `${localisationText}`;
  const bigText = ` ${localisationText}\nCode Alerte-Secours #${code}.`;

  return {
    title: `Infos de localisation pour les secours`,
    body: text,
    bigText,
  };
};

export const generateRelativeAllowAskContent = (data = {}) => {
  const { number, phoneNumber } = data;
  const resolvedPhoneNumber = number ?? phoneNumber ?? RELATIVE_PHONE_FALLBACK;
  const text = `${resolvedPhoneNumber} souhaite que vous soyez son contact d'urgence`;
  const bigText = `Un utilisateur souhaite que vous soyez son contact d'urgence, voici son numéro de téléphone: ${resolvedPhoneNumber}`;

  return {
    title: `Autoriser contact d'urgence`,
    body: text,
    bigText,
  };
};

export const generateRelativeInvitationContent = (data = {}) => {
  const { number, phoneNumber } = data;
  const resolvedPhoneNumber = number ?? phoneNumber ?? RELATIVE_PHONE_FALLBACK;

  const text = `${resolvedPhoneNumber} vous propose d'être votre contact d'urgence`;
  const bigText = `Un utilisateur vous propose d'être votre contact d'urgence, voici son numéro de téléphone: ${resolvedPhoneNumber}`;

  return {
    title: `Accepter contact d'urgence`,
    body: text,
    bigText,
  };
};

export const generateSuggestCloseContent = (data) => {
  const { code } = data;

  return {
    title: `Alerte toujours en cours`,
    body: `Votre alerte est toujours ouverte, pensez à la terminer si la situation est résolue`,
    code,
  };
};

export const generateSuggestKeepOpenContent = (data) => {
  const { code } = data;

  return {
    title: `Alerte bientôt expirée`,
    body: `Votre alerte va bientôt expirer, gardez la ouverte si la situation n'est pas résolue`,
    code,
  };
};

export const generateBackgroundGeolocationLostContent = (data) => {
  return {
    title: `Alerte-Secours ne reçoit plus de mises à jour de votre position`,
    body: `Vous ne pourrez plus recevoir d'alertes de proximité. Vérifiez les paramètres.`,
    bigText: `Alerte-Secours ne reçoit plus de mises à jour de votre position en arrière-plan. Vous ne pourrez plus recevoir d'alertes de proximité. Causes possibles : permissions révoquées, optimisation de batterie active, ou actualisation désactivée. Accédez aux paramètres de l'application pour réactiver.`,
  };
};

export const getNotificationContent = (enumType, data) => {
  const type = kebabCase(enumType);

  if (!data) {
    return { title: type, body: "" };
  }

  switch (type) {
    case "alert":
      return generateAlertContent(data);
    case "alert-emergency-info":
      return generateAlertEmergencyInfoContent(data);
    case "relative-allow-ask":
      return generateRelativeAllowAskContent(data);
    case "relative-invitation":
      return generateRelativeInvitationContent(data);
    case "suggest-close":
      return generateSuggestCloseContent(data);
    case "suggest-keep-open":
      return generateSuggestKeepOpenContent(data);
    case "background-geolocation-lost":
      return generateBackgroundGeolocationLostContent(data);
    default:
      return { title: type, body: JSON.stringify(data) };
  }
};
