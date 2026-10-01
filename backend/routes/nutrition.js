const express = require("express");
const authMiddleware = require("../middleware/auth");
const indianFoods = require("../data/indianFoods.json");

const router = express.Router();

// Search our own curated dataset first — plain substring match against
// each dish's name and its common alternate spellings.
function searchIndianFoods(query) {
    const q = query.trim().toLowerCase();

    return indianFoods
        .filter(food => {
            const nameMatch = food.name.toLowerCase().includes(q);
            const aliasMatch = (food.aliases || []).some(a => a.toLowerCase().includes(q));
            return nameMatch || aliasMatch;
        })
        .map(food => ({
            foodName: food.name,
            serving: food.serving,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            source: "local"
        }));
}

router.get("/search", authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "A search query is required" });
        }

        // Check our curated Indian-dish dataset first — USDA's database
        // barely covers home-cooked composite dishes like biryani or dosa,
        // so we supplement it with researched typical-serving values.
        const localMatches = searchIndianFoods(query);
        if (localMatches.length > 0) {
            return res.json({ message: "Foods found", results: localMatches });
        }

        // Fall back to USDA for anything not in our curated list
        // (raw ingredients, Western foods, branded products, etc.)
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

        const results = data.foods
            .map(food => {
                let calories = getNutrient(food.foodNutrients, "Energy", "KCAL");
                let protein = getNutrient(food.foodNutrients, "Protein");
                let carbs = getNutrient(food.foodNutrients, "Carbohydrate, by difference");
                let fat = getNutrient(food.foodNutrients, "Total lipid (fat)");

                // Branded/packaged foods (like chips) often leave the generic
                // nutrient list incomplete, but carry the same numbers a
                // second way — in labelNutrients, taken straight off the
                // actual nutrition-facts panel. Fall back to that when the
                // first method comes up empty or zero.
                const label = food.labelNutrients || {};
                if (!calories) calories = label.calories?.value ?? calories;
                if (!protein) protein = label.protein?.value ?? protein;
                if (!carbs) carbs = label.carbohydrates?.value ?? carbs;
                if (!fat) fat = label.fat?.value ?? fat;

                // USDA's serving-size field and its nutrient values don't
                // always describe the same basis — sometimes the numbers
                // are really "per 100g" even though servingSize claims
                // something smaller. Catch that: if the macros alone
                // outweigh the claimed serving, the serving label is wrong.
                let serving = food.servingSize && food.servingSizeUnit
                    ? `${Math.round(food.servingSize)}${food.servingSizeUnit}`
                    : "100g (reference amount)";

                const macroGrams = (protein || 0) + (carbs || 0) + (fat || 0);
                if (food.servingSizeUnit === "g" && macroGrams > food.servingSize) {
                    serving = "100g (reference amount)";
                }

                return {
                    fdcId: food.fdcId,
                    foodName: food.description,
                    serving,
                    calories,
                    protein,
                    carbs,
                    fat
                };
            })
            // Drop anything where we still have no real calorie number —
            // better to show fewer, trustworthy results than a "0 kcal" or
            // "? kcal" row that looks like the app is broken.
            .filter(item => item.calories !== null && item.calories !== undefined && item.calories > 0);

        if (results.length === 0) {
            return res.status(404).json({ message: "No foods found" });
        }

        res.json({ message: "Foods found", results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;