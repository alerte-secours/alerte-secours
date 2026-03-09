/**
 * v1 keyword detection for cardiac / defibrillator-related alert subjects.
 *
 * Requirements:
 * - normalize: lowercase + remove diacritics
 * - regex list (no fuzzy lib)
 * - pure helper with unit tests
 */

function normalizeSubjectText(subject) {
  if (typeof subject !== "string") {
    return "";
  }

  // NFD splits accents into combining marks, then we strip them.
  // Using explicit unicode range for broad RN JS compatibility.
  return (
    subject
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Common French ligatures that aren't removed by diacritics stripping
      // (e.g. "cœur" => "coeur").
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
  );
}

// NOTE: operate on normalized (diacritics-stripped) text.
const DEFIB_SUGGESTION_REGEXES = [
  // Cardiac keywords
  /\bcardiaqu\w*\b/, // cardiaque, cardiaques...
  /\bcardiac\w*\b/, // cardiac, cardiacs...
  /\bcardiqu\w*\b/, // cardique (common typo)
  /\bcoeur\b/, // coeur (after normalization also matches cœur)

  // Malaise common typos
  /\bmalaise\b/,
  /\bmailaise\b/,
  /\bmallaise\b/,

  // Unconsciousness
  /\binconscient\w*\b/, // inconscient, inconsciente...
  /\bevanoui\w*\b/, // evanoui, evanouie, evanouissement...

  // Arrest
  /\barret\b/, // arret (after normalization also matches arrêt)
  /\barret\s+cardiaqu\w*\b/, // arrêt cardiaque (strong signal)

  // Defibrillator
  /\bdefibrillat\w*\b/, // defibrillateur, defibrillation...

  // CPR / resuscitation
  /\breanimat\w*\b/, // reanimation, reanimer...
  /\bmassage\s+cardiaqu\w*\b/, // massage cardiaque

  // Not breathing
  /\bne\s+respire\s+plus\b/,
  /\brespire\s+plus\b/,
];

export function subjectSuggestsDefib(...texts) {
  return texts.some((input) => {
    const text = normalizeSubjectText(input);
    if (!text) {
      return false;
    }
    return DEFIB_SUGGESTION_REGEXES.some((re) => re.test(text));
  });
}

export const __private__ = {
  normalizeSubjectText,
  DEFIB_SUGGESTION_REGEXES,
};

export default subjectSuggestsDefib;
