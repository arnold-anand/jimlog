const Workout = require('../models/Workout');
const Routine = require('../models/Routine');
const ExercisePR = require('../models/ExercisePR');

// @desc    Start a new workout
// @route   POST /workouts
// @access  Private
const startWorkout = async (req, res) => {
    const { routineId, name } = req.body;

    try {
        let workoutData = {
            user: req.user._id,
            name: name || 'Workout',
            exercises: [],
        };

        if (routineId) {
            const routine = await Routine.findById(routineId);
            if (routine) {
                workoutData.routine = routineId;
                workoutData.name = routine.name;

                // Fetch PRs for all exercises in the routine
                const exerciseIds = routine.exercises.map(e => e.exercise);
                const prs = await ExercisePR.find({
                    user: req.user._id,
                    exercise: { $in: exerciseIds }
                });

                // Create a map of exercise ID to PR
                const prMap = {};
                prs.forEach(pr => {
                    prMap[pr.exercise.toString()] = pr;
                });

                // Pre-populate sets based on plannedSets with PR values
                workoutData.exercises = routine.exercises.map((e) => {
                    const pr = prMap[e.exercise.toString()];
                    const sets = [];

                    // Create plannedSets number of sets with PR values
                    for (let i = 0; i < e.plannedSets; i++) {
                        sets.push({
                            weight: pr?.bestSet?.weight || 0,
                            reps: pr?.bestSet?.reps || 0,
                            completed: false
                        });
                    }

                    return {
                        exercise: e.exercise,
                        sets: sets
                    };
                });
            }
        }

        const workout = await Workout.create(workoutData);
        await workout.populate('exercises.exercise');
        res.status(201).json(workout);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get active workout
// @route   GET /workouts/active
// @access  Private
const getActiveWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOne({
            user: req.user._id,
            endedAt: null,
        }).populate('exercises.exercise');

        if (workout) {
            res.json(workout);
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update workout (log sets)
// @route   PUT /workouts/:id
// @access  Private
const updateWorkout = async (req, res) => {
    const { exercises } = req.body;

    try {
        const workout = await Workout.findById(req.params.id);

        if (workout && workout.user.toString() === req.user._id.toString()) {
            workout.exercises = exercises || workout.exercises;
            const updatedWorkout = await workout.save();
            // Need to repopulate execution details
            await updatedWorkout.populate('exercises.exercise');
            res.json(updatedWorkout);
        } else {
            res.status(404).json({ message: 'Workout not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper to update PRs
const triggerPRUpdates = async (workout) => {
    for (const exerciseData of workout.exercises) {
        const { exercise, sets } = exerciseData;

        let maxWeight = 0;
        let maxVolume = 0;
        let maxReps = 0;
        let bestSet = { weight: 0, reps: 0 };

        sets.forEach(set => {
            if (!set.completed) return;

            if (set.weight > maxWeight) maxWeight = set.weight;
            if (set.reps > maxReps) maxReps = set.reps;

            const volume = set.weight * set.reps;
            if (volume > maxVolume) maxVolume = volume;

            if (set.weight > bestSet.weight || (set.weight === bestSet.weight && set.reps > bestSet.reps)) {
                bestSet = { weight: set.weight, reps: set.reps };
            }
        });

        if (maxWeight === 0 && maxVolume === 0 && maxReps === 0) continue;

        let pr = await ExercisePR.findOne({ user: workout.user, exercise });

        if (!pr) {
            pr = new ExercisePR({
                user: workout.user,
                exercise,
                oneRepMax: maxWeight,
                maxVolume,
                maxReps,
                bestSet
            });
        } else {
            if (maxWeight > pr.oneRepMax) pr.oneRepMax = maxWeight;
            if (maxVolume > pr.maxVolume) pr.maxVolume = maxVolume;
            if (maxReps > pr.maxReps) pr.maxReps = maxReps;
            // Only update bestSet if weight is higher, or weight is same and reps are higher
            if (bestSet.weight > (pr.bestSet?.weight || 0) || (bestSet.weight === (pr.bestSet?.weight || 0) && bestSet.reps > (pr.bestSet?.reps || 0))) {
                pr.bestSet = bestSet;
            }
        }

        await pr.save();
    }
};

// @desc    Delete workout
// @route   DELETE /workouts/:id
// @access  Private
const deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);

        if (workout && workout.user.toString() === req.user._id.toString()) {
            await Workout.deleteOne({ _id: req.params.id });
            res.json({ message: 'Workout deleted' });
        } else {
            res.status(404).json({ message: 'Workout not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    End workout
// @route   POST /workouts/:id/end
// @access  Private
const endWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);

        if (workout && workout.user.toString() === req.user._id.toString()) {
            workout.endedAt = Date.now();
            await workout.save();

            // Calculate PRs
            await triggerPRUpdates(workout);

            res.json(workout);
        } else {
            res.status(404).json({ message: 'Workout not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user workouts history
// @route   GET /workouts
// @access  Private
const getWorkouts = async (req, res) => {
    try {
        const workouts = await Workout.find({ user: req.user._id, endedAt: { $ne: null } })
            .sort({ endedAt: -1 })
            .populate('exercises.exercise');

        res.json(workouts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    startWorkout,
    getActiveWorkout,
    updateWorkout,
    deleteWorkout,
    endWorkout,
    getWorkouts,
};
