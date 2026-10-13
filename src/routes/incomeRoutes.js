const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { validateIncome } = require('../middleware/validator');

router.get('/', (req, res, next) => incomeController.getAll(req, res, next));
router.get('/:id', (req, res, next) => incomeController.getById(req, res, next));
router.post('/', validateIncome, (req, res, next) => incomeController.create(req, res, next));
router.put('/:id', validateIncome, (req, res, next) => incomeController.update(req, res, next));
router.delete('/:id', (req, res, next) => incomeController.delete(req, res, next));

module.exports = router;
