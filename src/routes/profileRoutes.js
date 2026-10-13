const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', (req, res, next) => profileController.getProfile(req, res, next));
router.put('/', (req, res, next) => profileController.updateProfile(req, res, next));

module.exports = router;
