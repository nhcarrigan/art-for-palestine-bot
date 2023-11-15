/**
 * Parses a unit string into units.
 *
 * @param {string} unit The unit string to parse.
 * @returns {number} The unit conversion rate, to convert a number to ms.
 */
export const getMuteDurationUnit = (unit: string): number | null => {
  switch (unit.toLowerCase()) {
    case "m":
    case "minute":
    case "min":
    case "minutes":
      return 1000 * 60;
    case "h":
    case "hours":
    case "hour":
      return 1000 * 60 * 60;
    case "d":
    case "day":
    case "days":
      return 1000 * 60 * 60 * 24;
  }
  return null;
};
