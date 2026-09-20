const mongoose = require("mongoose");

const foodLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    foodName: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        required: true
    },
    protein: Number,
    carbs: Number,
    fat: Number,
    servingSize: String,
    mealType: {
        type: String,
        enum: ["breakfast", "lunch", "dinner", "snack"]
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("FoodLog", foodLogSchema);