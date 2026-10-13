const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { validateExpense } = require('../middleware/validator');

router.get('/', (req, res, next) => expenseController.getAll(req, res, next));
router.get('/:id', (req, res, next) => expenseController.getById(req, res, next));
router.post('/', validateExpense, (req, res, next) => expenseController.create(req, res, next));
router.put('/:id', validateExpense, (req, res, next) => expenseController.update(req, res, next));
router.delete('/:id', (req, res, next) => expenseController.delete(req, res, next));

module.exports = router;
