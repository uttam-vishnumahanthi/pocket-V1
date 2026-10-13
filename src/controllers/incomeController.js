const incomeService = require('../services/incomeService');

class IncomeController {
  getAll(req, res, next) {
    try {
      const incomeList = incomeService.getAllIncome(req.query);
      res.json({ success: true, data: incomeList });
    } catch (err) {
      next(err);
    }
  }

  getById(req, res, next) {
    try {
      const income = incomeService.getIncomeById(req.params.id);
      if (!income) {
        return res.status(404).json({ success: false, error: 'Income entry not found' });
      }
      res.json({ success: true, data: income });
    } catch (err) {
      next(err);
    }
  }

  create(req, res, next) {
    try {
      const created = incomeService.createIncome(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  update(req, res, next) {
    try {
      const updated = incomeService.updateIncome(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Income entry not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  delete(req, res, next) {
    try {
      const deleted = incomeService.deleteIncome(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Income entry not found' });
      }
      res.json({ success: true, message: 'Income entry deleted successfully', id: req.params.id });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IncomeController();
