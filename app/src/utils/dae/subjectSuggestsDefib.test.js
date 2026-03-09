import { subjectSuggestsDefib } from "./subjectSuggestsDefib";

describe("dae/subjectSuggestsDefib", () => {
  test("returns false for non-string input", () => {
    expect(subjectSuggestsDefib(null)).toBe(false);
    expect(subjectSuggestsDefib(undefined)).toBe(false);
    expect(subjectSuggestsDefib(123)).toBe(false);
  });

  test("matches cardiac keywords (case-insensitive)", () => {
    expect(subjectSuggestsDefib("ARRET CARDIAQUE")).toBe(true);
    expect(subjectSuggestsDefib("cardiaque")).toBe(true);
    expect(subjectSuggestsDefib("cardiac arrest")).toBe(true);
    expect(subjectSuggestsDefib("cardique")).toBe(true);
  });

  test("matches diacritics variants", () => {
    expect(subjectSuggestsDefib("Arrêt cardiaque")).toBe(true);
    expect(subjectSuggestsDefib("Cœur")).toBe(true);
    expect(subjectSuggestsDefib("Évanoui")).toBe(true);
    expect(subjectSuggestsDefib("Réanimation")).toBe(true);
    expect(subjectSuggestsDefib("Défibrillateur")).toBe(true);
  });

  test("matches common typos", () => {
    expect(subjectSuggestsDefib("mallaise")).toBe(true);
    expect(subjectSuggestsDefib("mailaise")).toBe(true);
  });

  test("matches CPR / breathing phrases", () => {
    expect(subjectSuggestsDefib("massage cardiaque en cours")).toBe(true);
    expect(subjectSuggestsDefib("ne respire plus")).toBe(true);
    expect(subjectSuggestsDefib("il respire plus")).toBe(true);
  });

  test("does not match unrelated subject", () => {
    expect(subjectSuggestsDefib("mal au dos")).toBe(false);
    expect(subjectSuggestsDefib("panne de voiture")).toBe(false);
  });

  test("matches when keyword is in second argument (description)", () => {
    expect(
      subjectSuggestsDefib(
        "urgence médicale mortelle",
        "crise cardiaque, attaque cérébrale, hémorragie importante, blessure grave",
      ),
    ).toBe(true);
  });

  test("matches when keyword is only in subject, not description", () => {
    expect(subjectSuggestsDefib("arrêt cardiaque", "some other desc")).toBe(
      true,
    );
  });

  test("does not match when neither subject nor description has keywords", () => {
    expect(subjectSuggestsDefib("agression", "violence physique")).toBe(false);
  });

  test("handles null/undefined in multi-arg", () => {
    expect(subjectSuggestsDefib(null, "cardiaque")).toBe(true);
    expect(subjectSuggestsDefib("cardiaque", undefined)).toBe(true);
    expect(subjectSuggestsDefib(null, undefined)).toBe(false);
  });
});
