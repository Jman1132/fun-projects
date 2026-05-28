const assert = require("assert");
const {
  parseReferences,
  formatReference,
  getApplicableSectionText,
  getTextPreview,
} = require("../docs/penal-code-utils.js");

const section422 = `422.

(a) Any person who willfully threatens to commit a crime.

(b) In sentencing a person convicted of a felony violation of subdivision (a), the court may consider aggravation.

(c) (1) For purposes of this section, "immediate family" means family.

(2) For purposes of this section, "electronic communication device" includes phones.`;

const section187 = `187.

(a) Murder is the unlawful killing of a human being.

(b) This section shall not apply to any person who commits an act that results in the death of a fetus if any of the following apply:

(1) The act complied with the former Therapeutic Abortion Act.

(2) The act was committed by a holder of a physician's and surgeon's certificate.`;

assert.deepStrictEqual(parseReferences("PC 422(a)"), [
  { section: "422", subdivisions: ["a"] },
]);
assert.deepStrictEqual(parseReferences("187(b)(1), 211"), [
  { section: "187", subdivisions: ["b", "1"] },
  { section: "211", subdivisions: [] },
]);
assert.strictEqual(parseReferences("robbery"), null);
assert.strictEqual(formatReference({ section: "187", subdivisions: ["b", "1"] }), "187(b)(1)");

const applicable422 = getApplicableSectionText(section422, {
  section: "422",
  subdivisions: ["c", "1"],
});
assert(applicable422.includes("422."));
assert(applicable422.includes("(c)"));
assert(applicable422.includes("(1) For purposes"));
assert(!applicable422.includes("(2) For purposes"));

const applicable187 = getApplicableSectionText(section187, {
  section: "187",
  subdivisions: ["b", "1"],
});
assert(applicable187.includes("(b) This section shall not apply"));
assert(applicable187.includes("(1) The act complied"));
assert(!applicable187.includes("(2) The act was committed"));

assert.strictEqual(getTextPreview("422.\n\n(a) Short text."), "(a) Short text.");

console.log("penal-code-utils tests passed");
