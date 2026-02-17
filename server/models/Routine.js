const mongoose = require('mongoose');

const routineSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        exercises: [
            {
                exercise: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Exercise',
                },
                plannedSets: {
                    type: Number,
                    required: true,
                    default: 3,
                },
                orderIndex: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Routine = mongoose.model('Routine', routineSchema);

module.exports = Routine;
