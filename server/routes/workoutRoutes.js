const express = require('express');
const router = express.Router();
const {
    startWorkout,
    getActiveWorkout,
    updateWorkout,
    endWorkout,
    deleteWorkout,
    getWorkouts,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, startWorkout);
router.route('/history').get(protect, getWorkouts);
router.route('/active').get(protect, getActiveWorkout);
router.route('/:id').put(protect, updateWorkout).delete(protect, deleteWorkout);
router.route('/:id/end').post(protect, endWorkout);

module.exports = router;
