const Exercise = require('../models/Exercise');

// @desc    Get all exercises
// @route   GET /exercises
// @access  Public (or Private? Public is fine for list)
const getExercises = async (req, res) => {
    try {
        const query = {};

        if (req.query.muscleGroup) {
            query.muscleGroups = { $in: [req.query.muscleGroup] };
        }

        if (req.query.equipment) {
            query.equipment = req.query.equipment;
        }

        const exercises = await Exercise.find(query).sort({ name: 1 });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getExercises };
