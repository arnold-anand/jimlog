const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exercises } = require('../data/exercises');
const Exercise = require('../models/Exercise');

// Load env vars
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gym-tracker');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        await Exercise.deleteMany();

        const formattedExercises = exercises.map((exercise) => {
            return {
                name: exercise.name,
                muscleGroups: [exercise.muscleGroup],
                equipment: exercise.equipment,
            };
        });

        await Exercise.insertMany(formattedExercises);

        console.log('Exercises Imported!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

importData();
