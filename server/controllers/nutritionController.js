const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Meal = require('../models/Meal');
const { calculateBMR, calculateTDEE } = require('../utils/nutrition');
const asyncHandler = require('express-async-handler');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy...'); // Fallback or env

// @desc    Update nutrition profile
// @route   POST /nutrition/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const { age, gender, height, weight, activityLevel, goal } = req.body;
    console.log('[DEBUG] updateProfile body:', req.body);

    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const bmr = calculateBMR(gender, weight, height, age);
    const tdee = calculateTDEE(bmr, activityLevel);

    let targetCalories = tdee;
    if (goal === 'weight_loss') targetCalories -= 500;
    else if (goal === 'mild_weight_loss') targetCalories -= 250;
    else if (goal === 'muscle_gain') targetCalories += 300;
    else if (goal === 'body_recomposition') targetCalories -= 100;

    // Science-based macros:
    // Protein (g) = body weight × multiplier based on goal
    // Fat = 25% of calories
    // Carbs = remainder
    const proteinPerKg = {
        weight_loss: 1.8,        // Higher protein preserves muscle during deficit
        mild_weight_loss: 1.6,
        maintain: 1.4,           // General maintenance for moderately active person
        muscle_gain: 1.8,        // Supports hypertrophy
        body_recomposition: 2.0, // High protein needed for simultaneous loss & gain
    };
    const multiplier = proteinPerKg[goal] || 1.4;
    const targetProtein = Math.round(weight * multiplier);
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

    user.nutritionProfile = {
        age, gender, height, weight, activityLevel, goal,
        tdee, targetCalories, targetProtein, targetCarbs, targetFat
    };

    console.log('[DEBUG] Saving user profile:', user.nutritionProfile);
    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        nutritionProfile: updatedUser.nutritionProfile
    });
});

// @desc    Log a meal using Gemini AI
// @route   POST /nutrition/meals
// @access  Private
const logMeal = asyncHandler(async (req, res) => {
    const { text, mealType, time } = req.body;

    if (!mealType) {
        res.status(400);
        throw new Error('Meal type is required');
    }

    let mealData = {
        name: mealType,
        items: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
    };

    if (process.env.GEMINI_API_KEY) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Parse the following meal description into individual food items. 
            CRITICAL INSTRUCTION: You must provide extremely accurate, realistic macronutrients based precisely on the USDA FoodData Central database. Do NOT overestimate.
            Standard references: 
            - 100g raw chicken breast = ~120 calories, ~23g protein, 0g carbs, ~2.5g fat.
            - 100g cooked white rice = ~130 calories, ~2.7g protein, ~28g carbs, ~0.3g fat.
            - Use RAW weights if specified in the prompt.
            For each item, provide: name, amount (e.g., "200 g raw weight", "250g"), calories, protein, carbs, fat, fiber.
            Description: "${text}"
            Format your response as a JSON array of objects: 
            [{"name": "...", "amount": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}]
            Return ONLY the JSON array, no markdown. Ensure all macro values are numbers based on precise USDA calculations for the given amounts.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();
            console.log("[DEBUG] AI Raw Response:", textResponse);
            const jsonStr = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const items = JSON.parse(jsonStr);

            if (Array.isArray(items) && items.length > 0) {
                mealData.items = items;
                mealData.name = items.map(i => i.name).join(', ').substring(0, 50);
                mealData.calories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
                mealData.protein = items.reduce((sum, i) => sum + (i.protein || 0), 0);
                mealData.carbs = items.reduce((sum, i) => sum + (i.carbs || 0), 0);
                mealData.fat = items.reduce((sum, i) => sum + (i.fat || 0), 0);
                mealData.fiber = items.reduce((sum, i) => sum + (i.fiber || 0), 0);
            }
        } catch (aiError) {
            console.error("AI Error Details:", aiError);
            mealData.items = [{
                name: text.substring(0, 30),
                amount: "1 serving",
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0
            }];
            mealData.calories = 0;
            mealData.protein = 0;
            mealData.carbs = 0;
            mealData.fat = 0;
            mealData.fiber = 0;
        }
    } else {
        // Fallback when API key is missing entirely
        console.warn("GEMINI_API_KEY is not defined - using default values");
        mealData.items = [{
            name: text.substring(0, 30),
            amount: "1 serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
        }];
        mealData.calories = 0;
        mealData.protein = 0;
        mealData.carbs = 0;
        mealData.fat = 0;
        mealData.fiber = 0;
    }

    const meal = await Meal.create({
        user: req.user._id,
        mealType,
        time,
        ...mealData
    });

    res.status(201).json(meal);
});

// @desc    Get meal by ID
// @route   GET /nutrition/:id
// @access  Private
const getMealById = asyncHandler(async (req, res) => {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }

    if (meal.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    res.json(meal);
});

// @desc    Get daily nutrition stats
// @route   GET /nutrition/daily
// @access  Private
const getDailyNutrition = asyncHandler(async (req, res) => {
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
        targets: user ? user.nutritionProfile : null
    });
});

// @desc    Get nutrition stats for a period
// @route   GET /nutrition/stats?period=7|30|365
// @access  Private
const getNutritionStats = asyncHandler(async (req, res) => {
    const period = parseInt(req.query.period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    startDate.setHours(0, 0, 0, 0);

    const user = await User.findById(req.user._id).select('nutritionProfile');

    // Aggregate meals by day
    const dailyData = await Meal.aggregate([
        {
            $match: {
                user: req.user._id,
                date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: period <= 30 ? '%Y-%m-%d' : '%Y-%m', date: '$date' }
                },
                calories: { $sum: '$calories' },
                protein: { $sum: '$protein' },
                carbs: { $sum: '$carbs' },
                fat: { $sum: '$fat' },
                fiber: { $sum: { $ifNull: ['$fiber', 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Map to { date, calories, protein, carbs, fat, fiber }
    const timeline = dailyData.map(d => ({
        date: d._id,
        calories: Math.round(d.calories),
        protein: Math.round(d.protein),
        carbs: Math.round(d.carbs),
        fat: Math.round(d.fat),
        fiber: Math.round(d.fiber)
    }));

    res.json({
        timeline,
        targets: user ? user.nutritionProfile : null
    });
});

module.exports = { updateProfile, logMeal, getMealById, getDailyNutrition, getNutritionStats };
