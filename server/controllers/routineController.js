const Routine = require('../models/Routine');

// @desc    Get user routines
// @route   GET /routines
// @access  Private
const getRoutines = async (req, res) => {
    try {
        const routines = await Routine.find({ user: req.user._id }).populate(
            'exercises.exercise'
        );
        res.json(routines);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single routine
// @route   GET /routines/:id
// @access  Private
const getRoutineById = async (req, res) => {
    try {
        const routine = await Routine.findById(req.params.id).populate(
            'exercises.exercise'
        );

        if (routine && routine.user.toString() === req.user._id.toString()) {
            res.json(routine);
        } else {
            res.status(404).json({ message: 'Routine not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a routine
// @route   POST /routines
// @access  Private
const createRoutine = async (req, res) => {
    const { name, exercises } = req.body;

    if (!exercises || exercises.length === 0) {
        return res.status(400).json({ message: 'No exercises added' });
    }

    try {
        const routine = new Routine({
            user: req.user._id,
            name,
            exercises, // Expecting array of objects { exercise: id, plannedSets, orderIndex }
        });

        const createdRoutine = await routine.save();
        res.status(201).json(createdRoutine);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a routine
// @route   DELETE /routines/:id
// @access  Private
const deleteRoutine = async (req, res) => {
    try {
        const routine = await Routine.findById(req.params.id);

        if (routine && routine.user.toString() === req.user._id.toString()) {
            await routine.deleteOne();
            res.json({ message: 'Routine removed' });
        } else {
            res.status(404).json({ message: 'Routine not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a routine
// @route   PUT /routines/:id
// @access  Private
const updateRoutine = async (req, res) => {
    const { name, exercises } = req.body;

    try {
        const routine = await Routine.findById(req.params.id);

        if (routine && routine.user.toString() === req.user._id.toString()) {
            routine.name = name || routine.name;
            routine.exercises = exercises || routine.exercises;

            const updatedRoutine = await routine.save();
            res.json(updatedRoutine);
        } else {
            res.status(404).json({ message: 'Routine not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getRoutines,
    getRoutineById,
    createRoutine,
    deleteRoutine,
    updateRoutine,
};
