import * as Localization from "expo-localization";
import osrmTextInstructionsFactory from "osrm-text-instructions";
import osrmTextLanguages from "osrm-text-instructions/languages";
import localeUtils from "@mapbox/locale-utils";
import humanizeDistance from "~/lib/geo/humanizeDistance";

const OSRMVersion = "v5";

export const osrmTextInstructions = osrmTextInstructionsFactory(OSRMVersion);

export const availableLocales = [
  "ar",
  "da",
  "de",
  "en",
  "eo",
  "es-ES",
  "es",
  "fi",
  "fr",
  "he",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "my",
  "nl",
  "no",
  "pl",
  "pt-BR",
  "pt-PT",
  "ro",
  "ru",
  "sl",
  "sv",
  "tr",
  "uk",
  "vi",
  "yo",
  "zh-Hans",
];

import { userLanguage } from "~/i18n";

import uncapitalize from "~/utils/string/uncapitalize";
import { ROUND_DISTANCE } from "./constants";

const locale = localeUtils.bestMatchingLocale(userLanguage, availableLocales);

export function stepToInstruction(step, options) {
  return osrmTextInstructions.compile(locale, step, options);
}
export function routeToInstructions(route, opts = {}) {
  const { useMarkups = true } = opts;
  const instructions = [];
  const options = {
    formatToken: (token, value) => {
      if (token === "way_name") {
        if (useMarkups) {
          return `<b>${value}</b>`;
        } else {
          return `"${value}"`;
        }
      }
      return value;
    },
  };
  let stepIndex = 0;
  for (const step of route) {
    let instruction = stepToInstruction(step, {
      ...options,
      // legCount: route.length,
      // legIndex: stepIndex,
    });
    instructions.push([instruction, step, stepIndex++]);
  }
  return instructions;
}

export function getPhrase(phraseKey, opts) {
  const localized = osrmTextLanguages.instructions[locale];
  const tokenString = localized[OSRMVersion].phrase[phraseKey];
  return osrmTextInstructions.tokenize(locale, tokenString, opts);
}

export function departInstruction(instructionOne, instructionTwo) {
  const distance = instructionOne[1].distance;
  const opts = {
    distance: humanizeDistance(distance),
    instruction_one: uncapitalize(instructionOne[0]),
    instruction_two: uncapitalize(instructionTwo[0]),
  };
  const phraseKey =
    distance >= ROUND_DISTANCE ? "two linked by distance" : "two linked";
  const textInstruction = getPhrase(phraseKey, opts);
  return [textInstruction, { ...instructionTwo[1] }];
}

export function arrivalInstruction(instructionOne, instructionTwo) {
  const distance = instructionOne[1].distance;
  const opts = {
    distance: humanizeDistance(distance),
    instruction_one: uncapitalize(instructionTwo[0]),
  };
  const phraseKey = "one in distance";
  const textInstruction = getPhrase(phraseKey, opts);
  return [textInstruction, { ...instructionTwo[1] }];
}
