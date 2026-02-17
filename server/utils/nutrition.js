// functions to calculate maintenance calories
const calculateBMR = (gender, weight, height, age) => {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
}

const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        super_active: 1.9,
    };
    return bmr * (multipliers[activityLevel] || 1.2);
}

module.exports = { calculateBMR, calculateTDEE };
