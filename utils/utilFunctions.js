//Helper functions
function parsePositiveInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

// Helper function
function parseIntIfPossible(val) {
  if (val === undefined || val === null) return undefined;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? undefined : n;
}

//utility function to safely parse attendees into an array
function parseAttendees(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => (isNaN(x) ? x : Number(x)));
  if (typeof val === "string") {
    if (val.includes(",")) {
      return val
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => (isNaN(x) ? x : Number(x)));
    }
    return [isNaN(val) ? val : Number(val)];
  }
  return [];
}

module.exports = { parsePositiveInt, parseIntIfPossible, parseAttendees };