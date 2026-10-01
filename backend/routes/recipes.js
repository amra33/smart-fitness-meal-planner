const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const Pantry = require("../models/pantry");

const MAX_RECIPES = 5;

/*
====================================================
COMMON SUPPORTING INGREDIENTS
These can be assumed in small quantities.
====================================================
*/

const SUPPORTING_INGREDIENTS = [
    "salt",
    "water",
    "oil",
    "vegetable oil",
    "olive oil",
    "coconut oil",
    "butter",
    "pepper",
    "black pepper",
    "turmeric",
    "cumin",
    "coriander",
    "coriander leaves",
    "cilantro",
    "chilli",
    "chili",
    "green chilli",
    "green chili",
    "red chilli",
    "red chili",
    "garlic",
    "ginger",
    "curry leaves",
    "lemon",
    "lime",
    "baking powder",
    "flour",
    "all purpose flour",
    "sugar"
];

/*
====================================================
MAJOR INGREDIENTS

If one of these appears in a recipe, it MUST be
available in the pantry.
====================================================
*/

const MAJOR_INGREDIENTS = [
    "chicken",
    "beef",
    "mutton",
    "lamb",
    "pork",
    "turkey",
    "duck",

    "fish",
    "salmon",
    "tuna",
    "cod",
    "sardine",
    "anchovy",
    "prawn",
    "prawns",
    "shrimp",
    "crab",
    "squid",
    "seafood",

    "paneer",
    "tofu",

    "egg",
    "eggs",

    "banana",
    "apple",
    "orange",

    "rice",
    "bread",
    "pasta",
    "noodles",

    "potato",
    "carrot",
    "cucumber",
    "lettuce",
    "spinach",
    "cabbage",
    "capsicum",
    "bell pepper",
    "peas",
    "corn",
    "mushroom"
];

/*
====================================================
WORDS / TYPES WE DON'T WANT
====================================================
*/

const REJECTED_WORDS = [
    "cake",
    "pie",
    "cookie",
    "brownie",
    "ice cream",
    "cheesecake",
    "donut",
    "doughnut",
    "pastry",
    "tart",
    "empanada",
    "dumpling",
    "deep fried",
    "deep-fried",
    "fried chicken",
    "seafood"
];

/*
====================================================
HELPER FUNCTIONS
====================================================
*/

function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");
}

function singular(value) {
    const word = normalize(value);

    if (word.endsWith("ies")) {
        return word.slice(0, -3) + "y";
    }

    if (
        word.endsWith("s") &&
        !word.endsWith("ss")
    ) {
        return word.slice(0, -1);
    }

    return word;
}

function ingredientsMatch(a, b) {
    const first = singular(a);
    const second = singular(b);

    return (
        first === second ||
        first.includes(second) ||
        second.includes(first)
    );
}

function pantryHasIngredient(
    pantryIngredients,
    ingredient
) {
    return pantryIngredients.some(item =>
        ingredientsMatch(item, ingredient)
    );
}

function hasAnyPantryIngredient(
    pantryIngredients,
    ingredients
) {
    return ingredients.some(ingredient =>
        pantryHasIngredient(
            pantryIngredients,
            ingredient
        )
    );
}

function countPantryMatches(
    pantryIngredients,
    ingredients
) {
    let count = 0;

    ingredients.forEach(ingredient => {
        if (
            pantryHasIngredient(
                pantryIngredients,
                ingredient
            )
        ) {
            count++;
        }
    });

    return count;
}

/*
====================================================
LOCAL SIMPLE RECIPES

These are the MAIN recommendations.
====================================================
*/

const LOCAL_RECIPES = [

    // ---------------- BANANA ----------------

    {
        strMeal: "Banana Pancake",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "banana"
        ],

        ingredients: [
            { ingredient: "Banana", measure: "1" },
            { ingredient: "Flour", measure: "1/2 cup" },
            { ingredient: "Milk", measure: "1/4 cup" },
            { ingredient: "Baking powder", measure: "1/2 tsp" }
        ],

        instructions: [
            "Mash the banana in a bowl.",
            "Add flour, milk and baking powder.",
            "Mix until you get a smooth batter.",
            "Heat a lightly greased pan.",
            "Pour a small amount of batter onto the pan.",
            "Cook both sides until lightly golden.",
            "Serve warm."
        ]
    },

    {
        strMeal: "Banana Toast",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "banana",
            "bread"
        ],

        ingredients: [
            { ingredient: "Bread", measure: "2 slices" },
            { ingredient: "Banana", measure: "1" },
            { ingredient: "Butter", measure: "1 tsp" }
        ],

        instructions: [
            "Toast the bread lightly.",
            "Slice the banana.",
            "Spread a small amount of butter on the toast.",
            "Place the banana slices on top.",
            "Serve immediately."
        ]
    },

    {
        strMeal: "Banana Milkshake",
        strCategory: "Drink",
        strArea: "Everyday",

        requiredIngredients: [
            "banana",
            "milk"
        ],

        ingredients: [
            { ingredient: "Banana", measure: "1" },
            { ingredient: "Milk", measure: "1 cup" }
        ],

        instructions: [
            "Peel and cut the banana.",
            "Add banana and milk to a blender.",
            "Blend until smooth.",
            "Serve chilled."
        ]
    },

    {
        strMeal: "Simple Banana Bread",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "banana",
            "bread"
        ],

        ingredients: [
            { ingredient: "Bread", measure: "2 slices" },
            { ingredient: "Banana", measure: "1" },
            { ingredient: "Milk", measure: "2 tbsp" }
        ],

        instructions: [
            "Mash the banana.",
            "Spread the mashed banana over the bread.",
            "Add a little milk if desired.",
            "Toast the bread lightly in a pan.",
            "Serve warm."
        ]
    },

    // ---------------- EGG ----------------

    {
        strMeal: "Egg Tomato Omelette",
        strCategory: "Breakfast",
        strArea: "Indian",

        requiredIngredients: [
            "egg",
            "tomato"
        ],

        ingredients: [
            { ingredient: "Egg", measure: "2" },
            { ingredient: "Tomato", measure: "1" },
            { ingredient: "Onion", measure: "1/2" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Beat the eggs in a bowl.",
            "Add chopped tomato, onion, pepper and salt.",
            "Mix well.",
            "Heat a little oil in a pan.",
            "Pour the mixture into the pan.",
            "Cook both sides until the egg is fully cooked.",
            "Serve hot."
        ]
    },

    {
        strMeal: "Egg Bread Toast",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "egg",
            "bread"
        ],

        ingredients: [
            { ingredient: "Egg", measure: "2" },
            { ingredient: "Bread", measure: "2 slices" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Beat the eggs with salt and pepper.",
            "Dip each bread slice into the egg mixture.",
            "Heat a lightly greased pan.",
            "Cook the bread on both sides.",
            "Serve hot."
        ]
    },

    {
        strMeal: "Simple Omelette",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "egg"
        ],

        ingredients: [
            { ingredient: "Egg", measure: "2" },
            { ingredient: "Onion", measure: "1/2" },
            { ingredient: "Tomato", measure: "1/2" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Beat the eggs in a bowl.",
            "Add chopped onion, tomato, pepper and salt.",
            "Heat a little oil in a pan.",
            "Pour the egg mixture into the pan.",
            "Cook both sides until fully cooked.",
            "Serve hot."
        ]
    },

    // ---------------- CHICKEN ----------------

    {
        strMeal: "Simple Chicken Salad",
        strCategory: "Main",
        strArea: "Everyday",

        requiredIngredients: [
            "chicken",
            "cucumber",
            "carrot"
        ],

        ingredients: [
            { ingredient: "Chicken", measure: "200 g" },
            { ingredient: "Cucumber", measure: "1" },
            { ingredient: "Carrot", measure: "1" },
            { ingredient: "Lemon", measure: "1/2" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Cook the chicken until completely done.",
            "Cut the chicken into small pieces.",
            "Chop the cucumber and carrot.",
            "Mix everything in a bowl.",
            "Add lemon juice, pepper and salt.",
            "Mix well and serve."
        ]
    },

    {
        strMeal: "Chicken Tomato Curry",
        strCategory: "Main",
        strArea: "Indian",

        requiredIngredients: [
            "chicken",
            "tomato",
            "onion"
        ],

        ingredients: [
            { ingredient: "Chicken", measure: "250 g" },
            { ingredient: "Tomato", measure: "2" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Oil", measure: "1 tbsp" },
            { ingredient: "Ginger", measure: "1 tsp" },
            { ingredient: "Garlic", measure: "1 tsp" },
            { ingredient: "Turmeric", measure: "1/2 tsp" },
            { ingredient: "Chilli powder", measure: "1/2 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Heat oil in a pan.",
            "Add onion, ginger and garlic.",
            "Cook until the onion becomes soft.",
            "Add tomato, turmeric and chilli powder.",
            "Cook until the tomato becomes soft.",
            "Add chicken and salt.",
            "Cover and cook until the chicken is completely cooked.",
            "Serve with rice or bread."
        ]
    },

    {
        strMeal: "Chicken Tomato Rice",
        strCategory: "Main",
        strArea: "Everyday",

        requiredIngredients: [
            "chicken",
            "tomato",
            "rice"
        ],

        ingredients: [
            { ingredient: "Chicken", measure: "200 g" },
            { ingredient: "Rice", measure: "1 cup" },
            { ingredient: "Tomato", measure: "2" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Oil", measure: "1 tbsp" },
            { ingredient: "Turmeric", measure: "1/2 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Cook the rice and keep it aside.",
            "Heat oil in a pan.",
            "Add onion and tomato.",
            "Cook until soft.",
            "Add chicken, turmeric and salt.",
            "Cook until the chicken is completely done.",
            "Add the cooked rice.",
            "Mix well and serve."
        ]
    },

    {
        strMeal: "Simple Chicken Rice",
        strCategory: "Main",
        strArea: "Everyday",

        requiredIngredients: [
            "chicken",
            "rice"
        ],

        ingredients: [
            { ingredient: "Chicken", measure: "200 g" },
            { ingredient: "Rice", measure: "2 cups cooked" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Pepper", measure: "1/2 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Cook the chicken with a little oil, salt and pepper.",
            "Add onion and cook until soft.",
            "Add the cooked rice.",
            "Mix everything well.",
            "Cook for another 2–3 minutes.",
            "Serve hot."
        ]
    },

    // ---------------- VEGETABLES ----------------

    {
        strMeal: "Carrot Cucumber Salad",
        strCategory: "Salad",
        strArea: "Everyday",

        requiredIngredients: [
            "carrot",
            "cucumber"
        ],

        ingredients: [
            { ingredient: "Carrot", measure: "1" },
            { ingredient: "Cucumber", measure: "1" },
            { ingredient: "Lemon", measure: "1/2" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Wash and chop the carrot and cucumber.",
            "Add them to a bowl.",
            "Add lemon juice, pepper and salt.",
            "Mix well and serve."
        ]
    },

    {
        strMeal: "Simple Vegetable Stir Fry",
        strCategory: "Main",
        strArea: "Everyday",

        requiredIngredients: [
            "carrot",
            "capsicum"
        ],

        ingredients: [
            { ingredient: "Carrot", measure: "1" },
            { ingredient: "Capsicum", measure: "1" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Oil", measure: "1 tbsp" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Wash and chop the vegetables.",
            "Heat oil in a pan.",
            "Add onion and cook for a minute.",
            "Add carrot and capsicum.",
            "Stir-fry until the vegetables are slightly tender.",
            "Add pepper and salt.",
            "Serve hot."
        ]
    },

    // ---------------- RICE ----------------

    {
        strMeal: "Egg Fried Rice",
        strCategory: "Main",
        strArea: "Everyday",

        requiredIngredients: [
            "egg",
            "rice"
        ],

        ingredients: [
            { ingredient: "Egg", measure: "2" },
            { ingredient: "Rice", measure: "2 cups cooked" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Oil", measure: "1 tbsp" },
            { ingredient: "Pepper", measure: "1/2 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Heat oil in a pan.",
            "Add onion and cook until soft.",
            "Add beaten eggs and scramble them.",
            "Add cooked rice.",
            "Add pepper and salt.",
            "Mix well and cook for a few minutes.",
            "Serve hot."
        ]
    },

    {
        strMeal: "Simple Tomato Rice",
        strCategory: "Main",
        strArea: "Indian",

        requiredIngredients: [
            "rice",
            "tomato"
        ],

        ingredients: [
            { ingredient: "Rice", measure: "2 cups cooked" },
            { ingredient: "Tomato", measure: "2" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Oil", measure: "1 tbsp" },
            { ingredient: "Turmeric", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Heat oil in a pan.",
            "Add onion and cook until soft.",
            "Add chopped tomatoes and turmeric.",
            "Cook until the tomatoes become soft.",
            "Add cooked rice and salt.",
            "Mix well and cook for a few minutes.",
            "Serve hot."
        ]
    },

    // ---------------- BREAD + VEGETABLE ----------------

    {
        strMeal: "Vegetable Sandwich",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "bread",
            "cucumber"
        ],

        ingredients: [
            { ingredient: "Bread", measure: "4 slices" },
            { ingredient: "Cucumber", measure: "1/2" },
            { ingredient: "Tomato", measure: "1" },
            { ingredient: "Onion", measure: "1/2" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Slice the cucumber, tomato and onion.",
            "Place the vegetables between two bread slices.",
            "Add pepper and salt.",
            "Toast lightly if desired.",
            "Serve immediately."
        ]
    },

    // ---------------- PANEER ----------------

    {
        strMeal: "Paneer Tomato Stir Fry",
        strCategory: "Main",
        strArea: "Everyday",

        requiredIngredients: [
            "paneer",
            "tomato"
        ],

        ingredients: [
            { ingredient: "Paneer", measure: "200 g" },
            { ingredient: "Tomato", measure: "1" },
            { ingredient: "Onion", measure: "1" },
            { ingredient: "Oil", measure: "1 tbsp" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Heat oil in a pan.",
            "Add onion and cook until soft.",
            "Add tomato and cook for a few minutes.",
            "Add paneer, pepper and salt.",
            "Mix gently and cook for 3–4 minutes.",
            "Serve hot."
        ]
    },

    {
        strMeal: "Paneer Sandwich",
        strCategory: "Breakfast",
        strArea: "Everyday",

        requiredIngredients: [
            "paneer",
            "bread"
        ],

        ingredients: [
            { ingredient: "Paneer", measure: "100 g" },
            { ingredient: "Bread", measure: "4 slices" },
            { ingredient: "Tomato", measure: "1" },
            { ingredient: "Onion", measure: "1/2" },
            { ingredient: "Pepper", measure: "1/4 tsp" },
            { ingredient: "Salt", measure: "to taste" }
        ],

        instructions: [
            "Mash or crumble the paneer.",
            "Add chopped tomato and onion.",
            "Season with pepper and salt.",
            "Spread the mixture on bread.",
            "Toast lightly if desired.",
            "Serve."
        ]
    }
];

/*
====================================================
CHECK WHETHER A LOCAL RECIPE IS SUITABLE
====================================================
*/

function localRecipeMatches(
    recipe,
    pantryIngredients
) {
    const required =
        recipe.requiredIngredients || [];

    /*
        At least ONE main ingredient must come
        from the pantry.
    */

    if (
        !hasAnyPantryIngredient(
            pantryIngredients,
            required
        )
    ) {
        return false;
    }

    /*
        IMPORTANT:
        Every major ingredient used by the recipe
        must be available.
    */

    for (
        const ingredient
        of required
    ) {

        if (
            MAJOR_INGREDIENTS.some(
                major =>
                    ingredientsMatch(
                        ingredient,
                        major
                    )
            )
        ) {

            if (
                !pantryHasIngredient(
                    pantryIngredients,
                    ingredient
                )
            ) {
                return false;
            }
        }
    }

    return true;
}

/*
====================================================
THEMEALDB FALLBACK
====================================================
*/

function extractApiIngredients(meal) {

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {

        const ingredient =
            meal[`strIngredient${i}`];

        if (
            ingredient &&
            ingredient.trim()
        ) {
            ingredients.push(
                ingredient.trim()
            );
        }
    }

    return ingredients;
}

function isRejectedApiRecipe(meal) {

    const name =
        normalize(meal.strMeal);

    const category =
        normalize(meal.strCategory);

    if (
        category.includes("dessert") ||
        category.includes("sweet")
    ) {
        return true;
    }

    return REJECTED_WORDS.some(word =>
        name.includes(
            normalize(word)
        )
    );
}

function suitableApiRecipe(
    meal,
    pantryIngredients
) {

    if (isRejectedApiRecipe(meal)) {
        return false;
    }

    const ingredients =
        extractApiIngredients(meal);

    if (ingredients.length === 0) {
        return false;
    }

    /*
        MAIN/Major ingredients must exist
        in the pantry.
    */

    for (
        const ingredient
        of ingredients
    ) {

        const isMajor =
            MAJOR_INGREDIENTS.some(
                major =>
                    ingredientsMatch(
                        ingredient,
                        major
                    )
            );

        if (isMajor) {

            if (
                !pantryHasIngredient(
                    pantryIngredients,
                    ingredient
                )
            ) {
                return false;
            }
        }
    }

    /*
        Recipe must use at least TWO
        available pantry ingredients when possible.

        This prevents things such as:
        Milk -> Mushroom Soup
        just because milk happens to be present.
    */

    const pantryMatchCount =
        countPantryMatches(
            pantryIngredients,
            ingredients
        );

    if (pantryMatchCount < 2) {
        return false;
    }

    /*
        Don't allow very complicated recipes.
    */

    if (ingredients.length > 10) {
        return false;
    }

    return true;
}

function convertApiRecipe(meal) {

    const ingredients = [];

    for (let i = 1; i <= 20; i++) {

        const ingredient =
            meal[`strIngredient${i}`];

        const measure =
            meal[`strMeasure${i}`];

        if (
            ingredient &&
            ingredient.trim()
        ) {

            ingredients.push({
                ingredient:
                    ingredient.trim(),

                measure:
                    measure
                        ? measure.trim()
                        : ""
            });
        }
    }

    return {
        strMeal: meal.strMeal,

        strCategory:
            meal.strCategory || "Recipe",

        strArea:
            meal.strArea || "Everyday",

        strMealThumb:
            meal.strMealThumb,

        ingredients,

        instructions:
            meal.strInstructions || ""
    };
}

/*
====================================================
GET RECIPE RECOMMENDATIONS
====================================================
*/

router.get(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const pantryItems =
                await Pantry.find({
                    userId: req.userId
                });

            if (
                pantryItems.length === 0
            ) {

                return res.json({
                    recipes: [],
                    message:
                        "Your pantry is empty. Add some ingredients first."
                });
            }

            const pantryIngredients =
                pantryItems.map(item =>
                    normalize(
                        item.ingredient
                    )
                );

            /*
            ====================================================
            STEP 1
            FIND OUR OWN SIMPLE RECIPES
            ====================================================
            */

            let localMatches =
                LOCAL_RECIPES.filter(
                    recipe =>
                        localRecipeMatches(
                            recipe,
                            pantryIngredients
                        )
                );

            /*
                Rank recipes by how many of the user's
                pantry ingredients they actually use.

                This number is NOT shown to the user.
            */

            localMatches.sort(
                (a, b) => {

                    const scoreA =
                        countPantryMatches(
                            pantryIngredients,
                            a.requiredIngredients
                        );

                    const scoreB =
                        countPantryMatches(
                            pantryIngredients,
                            b.requiredIngredients
                        );

                    return scoreB - scoreA;
                }
            );

            /*
                Start with our own recipes.
            */

            let finalRecipes =
                localMatches.slice(
                    0,
                    MAX_RECIPES
                );

            /*
            ====================================================
            STEP 2
            THEMEALDB ONLY IF WE DON'T HAVE 5
            ====================================================
            */

            if (
                finalRecipes.length <
                MAX_RECIPES
            ) {

                const candidates = [];

                for (
                    const pantryIngredient
                    of pantryIngredients
                ) {

                    try {

                        const searchIngredient =
                            encodeURIComponent(
                                pantryIngredient.replace(
                                    /\s+/g,
                                    "_"
                                )
                            );

                        const response =
                            await fetch(
                                `https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchIngredient}`
                            );

                        const data =
                            await response.json();

                        if (
                            data.meals &&
                            Array.isArray(
                                data.meals
                            )
                        ) {

                            candidates.push(
                                ...data.meals
                            );
                        }

                    } catch (error) {

                        console.error(
                            "TheMealDB search error:",
                            error.message
                        );
                    }
                }

                /*
                    Remove duplicate meals.
                */

                const uniqueCandidates =
                    Array.from(
                        new Map(
                            candidates.map(
                                meal => [
                                    meal.idMeal,
                                    meal
                                ]
                            )
                        ).values()
                    );

                /*
                    Check each recipe properly.
                */

                for (
                    const candidate
                    of uniqueCandidates
                ) {

                    if (
                        finalRecipes.length >=
                        MAX_RECIPES
                    ) {
                        break;
                    }

                    try {

                        const response =
                            await fetch(
                                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${candidate.idMeal}`
                            );

                        const data =
                            await response.json();

                        if (
                            !data.meals ||
                            !data.meals[0]
                        ) {
                            continue;
                        }

                        const meal =
                            data.meals[0];

                        if (
                            !suitableApiRecipe(
                                meal,
                                pantryIngredients
                            )
                        ) {
                            continue;
                        }

                        const recipe =
                            convertApiRecipe(
                                meal
                            );

                        /*
                            Avoid duplicate recipe names.
                        */

                        const duplicate =
                            finalRecipes.some(
                                existing =>
                                    normalize(
                                        existing.strMeal
                                    ) ===
                                    normalize(
                                        recipe.strMeal
                                    )
                            );

                        if (!duplicate) {

                            finalRecipes.push(
                                recipe
                            );
                        }

                    } catch (error) {

                        console.error(
                            "TheMealDB detail error:",
                            error.message
                        );
                    }
                }
            }

            /*
            ====================================================
            FINAL LIMIT
            ====================================================
            */

            finalRecipes =
                finalRecipes.slice(
                    0,
                    MAX_RECIPES
                );

            res.json({

                recipes:
                    finalRecipes,

                message:
                    finalRecipes.length > 0
                        ? "Here are some simple recipes based on the ingredients in your pantry."
                        : "No suitable recipes found. Try adding another ingredient."
            });

        } catch (error) {

            console.error(
                "Recipe route error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to get recipe recommendations."
            });
        }
    }
);

module.exports = router;