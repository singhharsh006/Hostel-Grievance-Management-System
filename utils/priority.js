// Automatic priority from the complaint text (no AI key needed)
const URGENT = ["fire", "short circuit", "sparking", "spark", "shock", "gas leak", "flood", "injury", "ragging", "harass", "unsafe", "emergency", "snake"];
const HIGH = ["no water", "no electricity", "power cut", "not working", "leak", "broken", "blocked", "overflow", "food poisoning", "infection", "stuck", "no wifi", "no internet"];
const LOW = ["suggestion", "request", "minor", "paint", "cosmetic", "dust"];

function detectPriority({ title = "", description = "", category = "" }) {
  const t = `${title} ${description}`.toLowerCase();
  if (URGENT.some((k) => t.includes(k))) return "Urgent";
  if (HIGH.some((k) => t.includes(k))) return "High";
  if (["water", "electricity"].includes(category) && /(since|days|long time|again|hours)/.test(t)) return "High";
  if (LOW.some((k) => t.includes(k))) return "Low";
  return "Medium";
}

module.exports = { detectPriority };
