const express = require("express");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/search", authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "A search query is required" });
        }

        const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.foods || data.foods.length === 0) {
            return res.status(404).json({ message: "No foods found" });
        }

        const getNutrient = (nutrients, name, unit) => {
            const matches = nutrients.filter(n => n.nutrientName === name);
            const exact = unit ? matches.find(n => n.unitName === unit) : null;
            return exact ? exact.value : (matches[0] ? matches[0].value : null);
        };

        const results = data.foods.map(food => ({
            fdcId: food.fdcId,
            foodName: food.description,
            calories: getNutrient(food.foodNutrients, "Energy", "KCAL"),
            protein: getNutrient(food.foodNutrients, "Protein"),
            carbs: getNutrient(food.foodNutrients, "Carbohydrate, by difference"),
            fat: getNutrient(food.foodNutrients, "Total lipid (fat)")
        }));

        res.json({ message: "Foods found", results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;