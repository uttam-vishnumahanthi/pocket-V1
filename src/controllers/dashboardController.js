const dashboardService = require('../services/dashboardService');

class DashboardController {
  getSummary(req, res, next) {
    try {
      const summary = dashboardService.getSummary();
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
