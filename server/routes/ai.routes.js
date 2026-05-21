const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/auth.middleware');
const {getQuestion} = require('../controllers/ai.controller');

router.post('/question', protect, getQuestion);

module.exports = router;