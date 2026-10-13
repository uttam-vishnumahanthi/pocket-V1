const express = require('express');
const router = express.Router();
const peopleController = require('../controllers/peopleController');
const { validatePeople } = require('../middleware/validator');

router.get('/', (req, res, next) => peopleController.getAll(req, res, next));
router.get('/:id', (req, res, next) => peopleController.getById(req, res, next));
router.post('/', validatePeople, (req, res, next) => peopleController.create(req, res, next));
router.put('/:id', validatePeople, (req, res, next) => peopleController.update(req, res, next));
router.delete('/:id', (req, res, next) => peopleController.delete(req, res, next));

module.exports = router;
