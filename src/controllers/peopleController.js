const peopleService = require('../services/peopleService');

class PeopleController {
  getAll(req, res, next) {
    try {
      const people = peopleService.getAllPeople(req.query);
      res.json({ success: true, data: people });
    } catch (err) {
      next(err);
    }
  }

  getById(req, res, next) {
    try {
      const person = peopleService.getPeopleById(req.params.id);
      if (!person) {
        return res.status(404).json({ success: false, error: 'Debt/People record not found' });
      }
      res.json({ success: true, data: person });
    } catch (err) {
      next(err);
    }
  }

  create(req, res, next) {
    try {
      const created = peopleService.createPeople(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  update(req, res, next) {
    try {
      const updated = peopleService.updatePeople(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Debt/People record not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  delete(req, res, next) {
    try {
      const deleted = peopleService.deletePeople(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Debt/People record not found' });
      }
      res.json({ success: true, message: 'Record deleted successfully', id: req.params.id });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PeopleController();
