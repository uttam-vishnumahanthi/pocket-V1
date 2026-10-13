const expenseService = require('../services/expenseService');

class ExpenseController {
  getAll(req, res, next) {
    try {
      const expenses = expenseService.getAllExpenses(req.query);
      res.json({ success: true, data: expenses });
    } catch (err) {
      next(err);
    }
  }

  getById(req, res, next) {
    try {
      const expense = expenseService.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
      }
      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }

  create(req, res, next) {
    try {
      const created = expenseService.createExpense(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  update(req, res, next) {
    try {
      const updated = expenseService.updateExpense(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  delete(req, res, next) {
    try {
      const deleted = expenseService.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Expense not found' });
      }
      res.json({ success: true, message: 'Expense deleted successfully', id: req.params.id });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExpenseController();
