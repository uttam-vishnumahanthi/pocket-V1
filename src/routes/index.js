const express = require('express');
const router = express.Router();

const expenseRoutes = require('./expenseRoutes');
const incomeRoutes = require('./incomeRoutes');
const peopleRoutes = require('./peopleRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const profileRoutes = require('./profileRoutes');
const debugRoutes = require('./debugRoutes');

router.use('/expenses', expenseRoutes);
router.use('/income', incomeRoutes);
router.use('/people', peopleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/debug', debugRoutes);

module.exports = router;
