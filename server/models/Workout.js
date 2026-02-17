const mongoose = require('mongoose');

const workoutSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        routine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Routine', // Optional, if started from a routine
        },
        name: {
            type: String,
            default: 'Workout',
        },
        exercises: [
            {
                exercise: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Exercise',
                },
                sets: [
                    {
                        weight: { type: Number, required: true },
                        reps: { type: Number, required: true },
                        completed: { type: Boolean, default: true },
                    },
                ],
            },
        ],
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Workout = mongoose.model('Workout', workoutSchema);

module.exports = Workout;
