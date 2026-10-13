/**
 * Currency Conversion and Integer Paise Utilities
 * Ensures zero floating-point drift by storing all monetary values as integer paise in SQLite.
 */

/**
 * Converts a rupee amount (e.g., 150.50 or "150.50") to integer paise (15050).
 * Uses Math.round to prevent floating point inaccuracies.
 * @param {number|string} amountInRupees
 * @returns {number} Integer paise
 */
function rupeesToPaise(amountInRupees) {
  const num = typeof amountInRupees === 'string' ? parseFloat(amountInRupees) : Number(amountInRupees);
  if (isNaN(num) || num === null || num === undefined) {
    return 0;
  }
  return Math.round(num * 100);
}

/**
 * Converts an integer paise amount (e.g., 15050) to rupee float (150.50).
 * @param {number} amountInPaise
 * @returns {number} Float rupees (two decimal precision)
 */
function paiseToRupees(amountInPaise) {
  const paise = parseInt(amountInPaise, 10);
  if (isNaN(paise)) {
    return 0;
  }
  return paise / 100;
}

module.exports = {
  rupeesToPaise,
  paiseToRupees
};
