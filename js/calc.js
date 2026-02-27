// js/calc.js
function n(val) {
  const x = Number(val);
  return Number.isFinite(x) ? x : 0;
}

function setOutput(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value === "" ? "" : String(value);
}

function getInputValue(id) {
  const el = document.getElementById(id);
  if (!el) return "";
  // input/textarea
  return "value" in el ? el.value : (el.textContent ?? "");
}

/**
 * Recalculate all derived values (attributes totals, skill totals, and core derived stats).
 * Call this after any user change, after loading state, and after reset.
 */
export function recalculateAll() {
  // Tier
  const tier = n(getInputValue("tier"));

  // Attributes totals
  const attr = {
    S: n(getInputValue("attrSRating")) + n(getInputValue("attrSBonus")),
    T: n(getInputValue("attrTRating")) + n(getInputValue("attrTBonus")),
    A: n(getInputValue("attrARating")) + n(getInputValue("attrABonus")),
    I: n(getInputValue("attrIRating")) + n(getInputValue("attrIBonus")),
    Wil: n(getInputValue("attrWilRating")) + n(getInputValue("attrWilBonus")),
    Int: n(getInputValue("attrIntRating")) + n(getInputValue("attrIntBonus")),
    Fel: n(getInputValue("attrFelRating")) + n(getInputValue("attrFelBonus")),
  };

  setOutput("attrSTotal", attr.S);
  setOutput("attrTTotal", attr.T);
  setOutput("attrATotal", attr.A);
  setOutput("attrITotal", attr.I);
  setOutput("attrWilTotal", attr.Wil);
  setOutput("attrIntTotal", attr.Int);
  setOutput("attrFelTotal", attr.Fel);

  // Skills totals = rating + bonus + linked attribute total
  const skills = [
    ["skAth", "S"],
    ["skAwa", "Int"],
    ["skBs", "A"],
    ["skCun", "Fel"],
    ["skDec", "Fel"],
    ["skIns", "Fel"],
    ["skIntim", "Wil"],
    ["skInv", "Int"],
    ["skLead", "Wil"],
    ["skMed", "Int"],
    ["skPer", "Fel"],
    ["skPil", "A"],
    ["skPsy", "Wil"],
    ["skSch", "Int"],
    ["skSte", "A"],
    ["skSur", "Wil"],
    ["skTech", "Int"],
    ["skWs", "I"],
  ];

  /** @type {Record<string, number>} */
  const skillTotals = {};

  for (const [prefix, attrKey] of skills) {
    const rating = n(getInputValue(`${prefix}Rating`));
    const bonus = n(getInputValue(`${prefix}Bonus`));
    const total = rating + bonus + n(attr[attrKey]);
    skillTotals[prefix] = total;
    setOutput(`${prefix}Total`, total);
  }

  // Core derived stats (non-editable outputs)
  const woundsMax = attr.T + 2 * tier;
  const shockMax = attr.Wil + tier;

  const defence = attr.I - 1;
  const resBase = attr.T + 1;
  const armourAR = n(getInputValue("armourAR"));
  const resTotal = resBase + armourAR;

  const conviction = attr.Wil;
  const resolve = attr.Wil - 1;
  const influence = attr.Fel - 1;
  const wealth = tier;

  // Passive Awareness = floor(Awareness total / 2)
  const passiveAwareness = Math.floor((skillTotals.skAwa ?? 0) / 2);

  setOutput("woundsMax", woundsMax);
  setOutput("shockMax", shockMax);
  setOutput("defence", defence);
  setOutput("resBase", resBase);
  setOutput("resTotal", resTotal);
  setOutput("conviction", conviction);
  setOutput("resolve", resolve);
  setOutput("influence", influence);
  setOutput("wealth", wealth);
  setOutput("passiveAwareness", passiveAwareness);
}
