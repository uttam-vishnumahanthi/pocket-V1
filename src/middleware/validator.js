/**
 * Input validation helpers for Express routes
 */

const VALID_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'entertainment',
  'utilities',
  'groceries',
  'others'
];

const VALID_EXPENSE_TYPES = ['need', 'want'];
const VALID_PEOPLE_TYPES = ['borrowed', 'spent'];

function validateExpense(req, res, next) {
  const { amount, category, type, datetime } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be a positive number greater than 0.'
    });
  }

  if (!category || !VALID_CATEGORIES.includes(category.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`
    });
  }

  if (!type || !VALID_EXPENSE_TYPES.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid type. Must be either "need" or "want".'
    });
  }

  if (!datetime || isNaN(Date.parse(datetime))) {
    return res.status(400).json({
      success: false,
      error: 'Valid datetime is required.'
    });
  }

  next();
}

function validateIncome(req, res, next) {
  const { amount, note, datetime } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be a positive number greater than 0.'
    });
  }

  if (!note || typeof note !== 'string' || !note.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Source or note is required.'
    });
  }

  if (!datetime || isNaN(Date.parse(datetime))) {
    return res.status(400).json({
      success: false,
      error: 'Valid datetime is required.'
    });
  }

  next();
}

function validatePeople(req, res, next) {
  const { type, person, amount, repaidAmount, date } = req.body;

  if (!type || !VALID_PEOPLE_TYPES.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Type must be either "borrowed" or "spent".'
    });
  }

  if (!person || typeof person !== 'string' || !person.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Person name is required.'
    });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be a positive number greater than 0.'
    });
  }

  const numRepaid = repaidAmount !== undefined && repaidAmount !== null ? parseFloat(repaidAmount) : 0;
  if (isNaN(numRepaid) || numRepaid < 0) {
    return res.status(400).json({
      success: false,
      error: 'Repaid amount cannot be negative.'
    });
  }

  if (numRepaid > numAmount) {
    return res.status(400).json({
      success: false,
      error: 'Repaid amount cannot exceed the total amount.'
    });
  }

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({
      success: false,
      error: 'Valid date is required.'
    });
  }

  next();
}

module.exports = {
  VALID_CATEGORIES,
  VALID_EXPENSE_TYPES,
  VALID_PEOPLE_TYPES,
  validateExpense,
  validateIncome,
  validatePeople
};
