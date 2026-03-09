import { fullFormats } from "ajv-formats/dist/formats";

// import localize from "ajv-i18n"
// const localize = {
//   en: require("ajv-i18n/localize/en"),
//   fr: require("ajv-i18n/localize/fr"),
// };

// import passwordStrength from "./keywords/passwordStrength";

export function getAjvSchemaOptions() {
  return {
    allErrors: true,
    $data: true,
    formats: fullFormats,
    coerceTypes: true,
    keywords: [
      // require("ajv-keywords/dist/keywords/typeof"),
      // passwordStrength(),
    ],
  };
}

export const ajvSchemaOptions = getAjvSchemaOptions();
