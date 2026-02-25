const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

// @desc    Get dashboard stats
// @route   GET /stats
// @access  Private
const getStats = async (req, res) => {
    try {
        const period = parseInt(req.query.period) || 30; // Default to 30 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        startDate.setHours(0, 0, 0, 0);

        // Previous period for comparison
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - period);
        const previousEndDate = new Date(startDate);

        const baseMatch = { user: req.user._id, endedAt: { $ne: null } };
        const currentPeriodMatch = { ...baseMatch, endedAt: { $gte: startDate } };
        const previousPeriodMatch = { ...baseMatch, endedAt: { $gte: previousStartDate, $lt: previousEndDate } };

        // 1. Muscle Distribution (Volume based)
        const getMuscleStats = async (matchStage) => {
            return await Workout.aggregate([
                { $match: matchStage },
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
                        sets: { $sum: 1 },
                        volume: { $sum: { $multiply: ['$exercises.sets.weight', '$exercises.sets.reps'] } },
                    },
                },
                { $sort: { sets: -1 } },
            ]);
        };

        const currentMuscleStats = await getMuscleStats(currentPeriodMatch);
        const previousMuscleStats = await getMuscleStats(previousPeriodMatch);

        // 2. Summary Cards Metrics (Count, Duration, Volume, Sets)
        const getSummaryMetrics = async (matchStage) => {
            const metrics = await Workout.aggregate([
                { $match: matchStage },
                {
                    $project: {
                        durationMs: { $subtract: ['$endedAt', '$startedAt'] },
                        exercises: 1
                    }
                },
                { $unwind: { path: '$exercises', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$exercises.sets', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$_id', // Group by workout first to get accurate workout count & duration
                        durationMs: { $first: '$durationMs' },
                        workoutSetsCount: {
                            $sum: { $cond: [{ $eq: ['$exercises.sets.completed', true] }, 1, 0] }
                        },
                        workoutVolume: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$exercises.sets.completed', true] },
                                    { $multiply: [{ $ifNull: ['$exercises.sets.weight', 0] }, { $ifNull: ['$exercises.sets.reps', 0] }] },
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalWorkouts: { $sum: 1 },
                        totalDurationMs: { $sum: { $max: ['$durationMs', 0] } },
                        totalSets: { $sum: '$workoutSetsCount' },
                        totalVolume: { $sum: '$workoutVolume' }
                    }
                }
            ]);
            return metrics[0] || { totalWorkouts: 0, totalDurationMs: 0, totalSets: 0, totalVolume: 0 };
        };

        const currentMetrics = await getSummaryMetrics(currentPeriodMatch);
        const previousMetrics = await getSummaryMetrics(previousPeriodMatch);

        // 3. Activity Timeline (Daily for 7/30 days, Monthly for 365)
        const getActivityTimeline = async (matchStage, currentPeriod) => {
            const groupByFormat = currentPeriod === 365 ? '%Y-%m' : '%Y-%m-%d';

            const timeline = await Workout.aggregate([
                { $match: matchStage },
                {
                    $project: {
                        dateGroup: { $dateToString: { format: groupByFormat, date: '$endedAt' } },
                        durationMs: { $subtract: ['$endedAt', '$startedAt'] },
                        exercises: 1
                    }
                },
                { $unwind: { path: '$exercises', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$exercises.sets', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { workoutId: '$_id', dateGroup: '$dateGroup' },
                        durationMs: { $first: '$durationMs' },
                        reps: {
                            $sum: { $cond: [{ $eq: ['$exercises.sets.completed', true] }, { $ifNull: ['$exercises.sets.reps', 0] }, 0] }
                        },
                        volume: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$exercises.sets.completed', true] },
                                    { $multiply: [{ $ifNull: ['$exercises.sets.weight', 0] }, { $ifNull: ['$exercises.sets.reps', 0] }] },
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id.dateGroup',
                        workouts: { $sum: 1 },
                        durationMs: { $sum: { $max: ['$durationMs', 0] } },
                        reps: { $sum: '$reps' },
                        volume: { $sum: '$volume' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            return timeline.map(item => ({
                date: item._id, // YYYY-MM-DD or YYYY-MM
                workouts: item.workouts,
                duration: Math.floor(item.durationMs / 60000), // in minutes
                reps: item.reps,
                volume: item.volume
            }));
        };

        const currentActivityTimeline = await getActivityTimeline(currentPeriodMatch, period);

        // Calculate Streak
        let streak = 0;
        const allWorkouts = await Workout.find(baseMatch).sort({ endedAt: -1 }).select('endedAt');
        if (allWorkouts.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let lastWorkoutDate = new Date(allWorkouts[0].endedAt);
            lastWorkoutDate.setHours(0, 0, 0, 0);

            // If the latest workout is older than yesterday, streak is 0
            const diffDaysFromToday = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));

            if (diffDaysFromToday <= 1) {
                streak = 1;
                let currentDateCheck = lastWorkoutDate;

                for (let i = 1; i < allWorkouts.length; i++) {
                    let nextWorkoutDate = new Date(allWorkouts[i].endedAt);
                    nextWorkoutDate.setHours(0, 0, 0, 0);

                    const dayDiff = Math.floor((currentDateCheck - nextWorkoutDate) / (1000 * 60 * 60 * 24));

                    if (dayDiff === 1) {
                        streak++;
                        currentDateCheck = nextWorkoutDate;
                    } else if (dayDiff === 0) {
                        // Multiple workouts in a day, ignore
                        continue;
                    } else {
                        // Gap > 1 day, streak broken
                        break;
                    }
                }
            }
        }

        res.json({
            period,
            streak,
            current: {
                muscleDistribution: currentMuscleStats,
                activityTimeline: currentActivityTimeline,
                workouts: currentMetrics.totalWorkouts,
                durationMinutes: Math.floor(currentMetrics.totalDurationMs / 60000),
                volume: currentMetrics.totalVolume,
                sets: currentMetrics.totalSets
            },
            previous: {
                muscleDistribution: previousMuscleStats,
                workouts: previousMetrics.totalWorkouts,
                durationMinutes: Math.floor(previousMetrics.totalDurationMs / 60000),
                volume: previousMetrics.totalVolume,
                sets: previousMetrics.totalSets
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getStats };
