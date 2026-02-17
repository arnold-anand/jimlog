const mongoose = require('mongoose');

const exerciseSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        muscleGroups: [
            {
                type: String, // e.g., 'Chest', 'Triceps'
                required: true,
            },
        ],
        equipment: {
            type: String, // e.g., 'Barbell', 'Dumbbell', 'Machine', 'Bodyweight'
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
