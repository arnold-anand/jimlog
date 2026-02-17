const express = require('express');
const router = express.Router();
const { getExercises } = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getExercises); // Protect so only logged in users can see? Or public? Prompt says "Separate: Exercise (global library)".

module.exports = router;
