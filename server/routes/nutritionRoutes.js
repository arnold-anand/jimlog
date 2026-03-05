const express = require('express');
const router = express.Router();
const { updateProfile, logMeal, getMealById, getDailyNutrition, getNutritionStats } = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/profile', protect, updateProfile);
router.post('/meals', protect, logMeal);
router.get('/daily', protect, getDailyNutrition);
router.get('/stats', protect, getNutritionStats);
router.get('/:id', protect, getMealById);

module.exports = router;
