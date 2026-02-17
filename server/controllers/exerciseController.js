const Exercise = require('../models/Exercise');

// @desc    Get all exercises
// @route   GET /exercises
// @access  Public (or Private? Public is fine for list)
const getExercises = async (req, res) => {
    try {
        const exercises = await Exercise.find({});
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getExercises };
