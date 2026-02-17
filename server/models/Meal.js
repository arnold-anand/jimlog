const mongoose = require('mongoose');

const mealSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String, // e.g., "Chicken breast and rice"
            required: true,
        },
        calories: {
            type: Number,
            required: true,
        },
        protein: {
            type: Number,
            required: true,
        },
        carbs: {
            type: Number,
            required: true,
        },
        fat: {
            type: Number,
            required: true,
        },
        fiber: {
            type: Number,
            default: 0
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
    }
);

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;
