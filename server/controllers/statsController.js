const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

// @desc    Get dashboard stats
// @route   GET /stats
// @access  Private
const getStats = async (req, res) => {
    try {
        // 1. Muscle Distribution (Volume based)
        // We need to aggregate all completed sets, join with exercises to get muscleGroups,
        // and sum volume per muscle.
        const muscleStats = await Workout.aggregate([
            { $match: { user: req.user._id, endedAt: { $ne: null } } },
            { $unwind: '$exercises' },
            { $unwind: '$exercises.sets' },
            { $match: { 'exercises.sets.completed': true } },
            {
                $lookup: {
                    from: 'exercises',
                    localField: 'exercises.exercise',
                    foreignField: '_id',
                    as: 'exerciseDetails',
                },
            },
            { $unwind: '$exerciseDetails' },
            { $unwind: '$exerciseDetails.muscleGroups' },
            {
                $group: {
                    _id: '$exerciseDetails.muscleGroups',
                    sets: { $sum: 1 }, // Count sets per muscle
                    volume: { $sum: { $multiply: ['$exercises.sets.weight', '$exercises.sets.reps'] } },
                },
            },
            { $sort: { sets: -1 } },
        ]);

        // 2. Weekly Activity (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyStats = await Workout.aggregate([
            {
                $match: {
                    user: req.user._id,
                    endedAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$endedAt' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Format weekly stats to be array of 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyActivity = days.map((day, index) => {
            const found = weeklyStats.find((s) => s._id === index + 1); // MongoDB dayOfWeek 1=Sun
            return { day, count: found ? found.count : 0 };
        });

        res.json({
            muscleDistribution: muscleStats,
            weeklyActivity
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getStats };
