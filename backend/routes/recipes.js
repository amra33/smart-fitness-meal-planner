const express = require("express");
const Pantry = require("../models/pantry");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

function normalizeIngredient(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/_/g, " ");
}

// GET recipe recommendations
router.get("/", authMiddleware, async (req, res) => {
    try {

        // Get user's pantry ingredients
        const pantryItems = await Pantry.find({
            userId: req.userId
        });

        if (pantryItems.length === 0) {
            return res.json({
                message: "Your pantry is empty",
                recipes: []
            });
        }

        // Store unique pantry ingredients
        const pantryIngredients = [
            ...new Set(
                pantryItems.map(item =>
                    normalizeIngredient(item.ingredient)
                )
            )
        ];

        const recipeIds = new Set();

        // Get recipes for each pantry ingredient
        // Limit the number collected from each ingredient
        // so common ingredients do not dominate the results.
        for (const ingredient of pantryIngredients) {

            const apiIngredient =
                ingredient.replace(/ /g, "_");

            try {

                const response = await fetch(
                    `https://www.themealdb.com/api/json/v1/1/filter.php?i=${apiIngredient}`
                );

                const data = await response.json();

                if (data.meals) {

                    data.meals
                        .slice(0, 10)
                        .forEach(meal => {
                            recipeIds.add(meal.idMeal);
                        });

                }

            } catch (error) {

                console.log(
                    "Could not search recipes for:",
                    ingredient
                );

            }
        }

        const recipes = [];

        // Get complete recipe details
        for (const id of recipeIds) {

            try {

                const response = await fetch(
                    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
                );

                const data = await response.json();

                if (!data.meals) {
                    continue;
                }

                const meal = data.meals[0];

                const recipeIngredients = [];

                // Read recipe ingredients
                for (let i = 1; i <= 20; i++) {

                    const ingredient =
                        meal[`strIngredient${i}`];

                    if (
                        ingredient &&
                        ingredient.trim() !== ""
                    ) {
                        recipeIngredients.push(
                            normalizeIngredient(ingredient)
                        );
                    }
                }

                // Find pantry ingredients present in recipe
                const matchedIngredients =
                    pantryIngredients.filter(
                        pantryIngredient =>
                            recipeIngredients.some(
                                recipeIngredient =>
                                    recipeIngredient ===
                                        pantryIngredient ||
                                    recipeIngredient.includes(
                                        pantryIngredient + " "
                                    ) ||
                                    recipeIngredient.startsWith(
                                        pantryIngredient + ","
                                    )
                            )
                    );

                const uniqueMatches =
                    [...new Set(matchedIngredients)];

                const matchCount =
                    uniqueMatches.length;

                const totalIngredients =
                    recipeIngredients.length;

                // Percentage of recipe ingredients
                // already available in pantry
                const matchPercentage =
                    totalIngredients > 0
                        ? Math.round(
                            (matchCount /
                                totalIngredients) * 100
                        )
                        : 0;

                // Percentage of pantry ingredients
                // found in this recipe
                const pantryMatchPercentage =
                    pantryIngredients.length > 0
                        ? Math.round(
                            (matchCount /
                                pantryIngredients.length) * 100
                        )
                        : 0;

                recipes.push({

                    idMeal: meal.idMeal,

                    strMeal: meal.strMeal,

                    strMealThumb:
                        meal.strMealThumb,

                    strCategory:
                        meal.strCategory,

                    strArea:
                        meal.strArea,

                    matchCount:
                        matchCount,

                    totalIngredients:
                        totalIngredients,

                    matchPercentage:
                        matchPercentage,

                    pantryMatchPercentage:
                        pantryMatchPercentage,

                    matchedIngredients:
                        uniqueMatches

                });

            } catch (error) {

                console.log(
                    "Could not fetch recipe details for:",
                    id
                );

            }
        }

        // Remove duplicate recipes
        const uniqueRecipes = [
            ...new Map(
                recipes.map(recipe => [
                    recipe.idMeal,
                    recipe
                ])
            ).values()
        ];

        // Rank recipes based mainly on
        // how many pantry ingredients they contain
        uniqueRecipes.sort((a, b) => {

            if (
                b.pantryMatchPercentage !==
                a.pantryMatchPercentage
            ) {
                return (
                    b.pantryMatchPercentage -
                    a.pantryMatchPercentage
                );
            }

            if (
                b.matchCount !==
                a.matchCount
            ) {
                return (
                    b.matchCount -
                    a.matchCount
                );
            }

            return (
                b.matchPercentage -
                a.matchPercentage
            );

        });

        res.json({

            message:
                "Recipes fetched successfully",

            recipes:
                uniqueRecipes.slice(0, 10)

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to fetch recipes"

        });
    }
});

module.exports = router;