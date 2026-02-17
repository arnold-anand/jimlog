const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Meal = require('../models/Meal');
const { calculateBMR, calculateTDEE } = require('../utils/nutrition');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy...'); // Fallback or env

// @desc    Update nutrition profile
// @route   POST /nutrition/profile
// @access  Private
const updateProfile = async (req, res) => {
    const { age, gender, height, weight, activityLevel, goal } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const bmr = calculateBMR(gender, weight, height, age);
            const tdee = calculateTDEE(bmr, activityLevel);

            let targetCalories = tdee;
            if (goal === 'weight_loss') targetCalories -= 500;
            else if (goal === 'mild_weight_loss') targetCalories -= 250;
            else if (goal === 'muscle_gain') targetCalories += 300;
            else if (goal === 'body_recomposition') targetCalories -= 100; // Slight deficit

            // Macros (Simplified split: 30% P, 35% C, 35% F for now, or standard)
            const targetProtein = (targetCalories * 0.3) / 4;
            const targetCarbs = (targetCalories * 0.35) / 4;
            const targetFat = (targetCalories * 0.35) / 9;

            user.nutritionProfile = {
                age, gender, height, weight, activityLevel, goal,
                tdee, targetCalories, targetProtein, targetCarbs, targetFat
            };

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                nutritionProfile: updatedUser.nutritionProfile
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Log a meal using Gemini AI
// @route   POST /nutrition/meals
// @access  Private
const logMeal = async (req, res) => {
    const { text } = req.body; // e.g., "2 boiled eggs and a slice of toast"

    if (!process.env.GEMINI_API_KEY) {
        // Fallback for demo if no API Key
        // return res.status(503).json({ message: 'AI Service Unavailable' });
    }

    try {
        // AI Processing
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Parse the following meal description and return JSON with: name (short summary), calories, protein, carbs, fat, fiber. 
        Description: "${text}"
        Format: {"name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
        Return ONLY JSON, no markdown.`;

        let mealData = {
            name: 'Logged Meal',
            calories: 500, // Dummy defaults if AI fails/not configured
            protein: 30,
            carbs: 50,
            fat: 20,
            fiber: 5
        };

        if (process.env.GEMINI_API_KEY) {
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const textResponse = response.text();
                // Strip markdown formatting if present
                const jsonStr = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                mealData = JSON.parse(jsonStr);
            } catch (aiError) {
                console.error("AI Error:", aiError);
                // Continue with fallback or error out
            }
        }

        const meal = await Meal.create({
            user: req.user._id,
            ...mealData
        });

        res.status(201).json(meal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get daily nutrition stats
// @route   GET /nutrition/daily
// @access  Private
const getDailyNutrition = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const meals = await Meal.find({
            user: req.user._id,
            date: { $gte: today }
        });

        const totals = meals.reduce((acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat,
            fiber: acc.fiber + (meal.fiber || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

        const user = await User.findById(req.user._id).select('nutritionProfile');

        res.json({
            date: today,
            totals,
            meals,
            targets: user.nutritionProfile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { updateProfile, logMeal, getDailyNutrition };
