const express = require('express');
const router = express.Router();
const { updateProfile, logMeal, getDailyNutrition } = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/profile', protect, updateProfile);
router.post('/meals', protect, logMeal);
router.get('/daily', protect, getDailyNutrition);

module.exports = router;
