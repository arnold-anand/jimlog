const express = require('express');
const router = express.Router();
const {
    getRoutines,
    createRoutine,
    getRoutineById,
    deleteRoutine,
    updateRoutine,
} = require('../controllers/routineController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getRoutines).post(protect, createRoutine);
router
    .route('/:id')
    .get(protect, getRoutineById)
    .delete(protect, deleteRoutine)
    .put(protect, updateRoutine);

module.exports = router;
