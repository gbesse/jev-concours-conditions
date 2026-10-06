import {
  str,
  obj,
  arrays,
  rows,
  integer,
  finite,
  safe,
  money,
  sum,
  boolean,
  one,
  refs,
  semantic,
  check,
  date,
  addYears,
} from "./helpers.mjs";
export const LIMIT =
  "Le moteur ne décide jamais une équivalence de diplôme. La notice datée et les décisions de l’organisateur priment sur les champs normalisés.";
export function validateInput(x) {}
export function prepare(x) {
  obj(x.candidate);
  obj(x.notice);
  date(x.candidate.submittedAt);
  date(x.notice.opens);
  date(x.notice.closes);
  if (x.notice.opens > x.notice.closes) throw new TypeError("Période inversée");
  str(x.candidate.session);
  str(x.notice.session);
  integer(x.candidate.diplomaLevel);
  integer(x.notice.requiredLevel);
  one(x.candidate.equivalence, [
    "sans-objet",
    "accordee",
    "en-attente",
    "refusee",
  ]);
  const r = refs(x.candidate, x.notice);
  let diploma =
    x.candidate.diplomaLevel >= x.notice.requiredLevel
      ? true
      : x.candidate.equivalence === "accordee"
        ? true
        : x.candidate.equivalence === "refusee"
          ? false
          : null;
  if (
    x.candidate.diplomaLevel < x.notice.requiredLevel &&
    x.candidate.equivalence === "accordee" &&
    !x.candidate.equivalenceDocId
  )
    diploma = null;
  const checks = [
    check(
      "session",
      "Session de la notice",
      x.candidate.session === x.notice.session,
      r,
    ),
    check(
      "inscription",
      "Dépôt dans la période",
      x.notice.opens <= x.candidate.submittedAt &&
        x.candidate.submittedAt <= x.notice.closes,
      r,
    ),
    check(
      "niveau",
      "Niveau ou équivalence documentée",
      diploma,
      refs(
        x.candidate,
        x.notice,
        ...(x.candidate.equivalenceDocId
          ? [{ docId: x.candidate.equivalenceDocId }]
          : []),
      ),
      "Faire examiner les équivalences et exemptions par l’organisateur.",
    ),
  ];
  const pairs = [
    semantic(
      "diplome",
      "Spécialité du diplôme",
      x.candidate.diplomaDescription,
      x.notice.diplomaRequirement,
      r,
      "La spécialité et la nature du diplôme correspondent-elles à la condition de cette notice ? Un niveau seul ne suffit pas.",
      true,
    ),
  ];
  return {
    checks,
    pairs,
    outputs: {
      session: x.notice.session,
      dateLimite: x.notice.closes,
      equivalence: x.candidate.equivalence,
      revueOrganisateurRequise: diploma === null,
    },
  };
}
