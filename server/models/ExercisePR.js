const mongoose = require('mongoose');

const exercisePRSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        exercise: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Exercise',
        },
        oneRepMax: {
            type: Number,
            default: 0,
        },
        maxVolume: {
            type: Number, // weight * reps
            default: 0,
        },
        maxReps: {
            type: Number, // max reps at any weight? Or just max reps? Spec says "Max reps at a weight"
            default: 0,
        },
        bestSet: {
            weight: Number,
            reps: Number
        }
    },
    {
        timestamps: true,
    }
);

// Ensure one PR document per user per exercise
exercisePRSchema.index({ user: 1, exercise: 1 }, { unique: true });

const ExercisePR = mongoose.model('ExercisePR', exercisePRSchema);

module.exports = ExercisePR;
