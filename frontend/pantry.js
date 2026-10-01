const API_URL = "http://localhost:5000/api/pantry";

const token = localStorage.getItem("token");


// ==========================================
// CHECK LOGIN
// ==========================================

if (!token) {
    window.location.href = "login.html";
}


// ==========================================
// LOAD PANTRY
// ==========================================

async function loadPantry() {

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message);
            return;
        }

        displayPantry(data.items);

    } catch (error) {

        console.error(error);

        showMessage("Cannot connect to server.");
    }
}


// ==========================================
// DISPLAY PANTRY
// ==========================================

function displayPantry(items) {

    const pantryList =
        document.getElementById("pantryList");

    pantryList.innerHTML = "";


    if (items.length === 0) {

        pantryList.innerHTML =
            "<p>Your pantry is empty. Add some ingredients!</p>";

        return;
    }


    items.forEach(item => {

        const div =
            document.createElement("div");

        div.className = "result-item";


        div.innerHTML = `

            <div class="item-text">

                <strong>
                    ${item.ingredient}
                </strong>

                <span class="macro-sub">
                    ${item.quantity} ${item.unit}
                </span>

            </div>

            <div>

                <button onclick="editItem(
                    '${item._id}',
                    '${item.ingredient}',
                    '${item.quantity}',
                    '${item.unit}'
                )">
                    Edit
                </button>

                <button onclick="deleteItem('${item._id}')">
                    Delete
                </button>

            </div>
        `;


        pantryList.appendChild(div);

    });
}


// ==========================================
// ADD INGREDIENT
// ==========================================

document
    .getElementById("pantryForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const ingredient =
                document
                    .getElementById("ingredient")
                    .value;


            const quantity =
                Number(
                    document
                        .getElementById("quantity")
                        .value
                );


            const unit =
                document
                    .getElementById("unit")
                    .value;


            try {

                const response =
                    await fetch(API_URL, {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " + token
                        },

                        body: JSON.stringify({

                            ingredient,
                            quantity,
                            unit

                        })
                    });


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        data.message
                    );

                    return;
                }


                showMessage(
                    "Ingredient added successfully!"
                );


                document
                    .getElementById("pantryForm")
                    .reset();


                loadPantry();

            } catch (error) {

                console.error(error);

                showMessage(
                    "Cannot connect to server."
                );
            }

        }
    );


// ==========================================
// EDIT INGREDIENT
// ==========================================

async function editItem(
    id,
    oldIngredient,
    oldQuantity,
    oldUnit
) {

    const ingredient =
        prompt(
            "Ingredient name:",
            oldIngredient
        );


    if (!ingredient) {
        return;
    }


    const quantity =
        prompt(
            "Quantity:",
            oldQuantity
        );


    if (quantity === null) {
        return;
    }


    const unit =
        prompt(
            "Unit:",
            oldUnit
        );


    if (!unit) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body: JSON.stringify({

                        ingredient,

                        quantity:
                            Number(quantity),

                        unit

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showMessage(
                data.message
            );

            return;
        }


        showMessage(
            "Ingredient updated!"
        );


        loadPantry();

    } catch (error) {

        console.error(error);

        showMessage(
            "Cannot connect to server."
        );
    }
}


// ==========================================
// DELETE INGREDIENT
// ==========================================

async function deleteItem(id) {

    const confirmDelete =
        confirm(
            "Remove this ingredient from your pantry?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {

                    method: "DELETE",

                    headers: {

                        "Authorization":
                            "Bearer " + token
                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showMessage(
                data.message
            );

            return;
        }


        showMessage(
            "Ingredient deleted!"
        );


        loadPantry();

    } catch (error) {

        console.error(error);

        showMessage(
            "Cannot connect to server."
        );
    }
}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(message) {

    document
        .getElementById("pantryMessage")
        .textContent = message;
}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    localStorage.removeItem("token");

    window.location.href =
        "login.html";
}


// ==========================================
// RECIPE RECOMMENDATIONS
// ==========================================

document
    .getElementById("recipeButton")
    .addEventListener(
        "click",
        async function () {

            try {

                showMessage(
                    "Finding recipes using your pantry..."
                );


                const response =
                    await fetch(
                        "http://localhost:5000/api/recipes",
                        {

                            method: "GET",

                            headers: {

                                "Authorization":
                                    "Bearer " + token
                            }

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    showMessage(
                        data.message
                    );

                    return;
                }


                displayRecipes(
                    data.recipes
                );


                showMessage(
                    data.message
                );


            } catch (error) {

                console.error(
                    "Recipe request error:",
                    error
                );


                showMessage(
                    "Cannot connect to recipe server."
                );
            }

        }
    );


// ==========================================
// DISPLAY RECIPES
// ==========================================

function displayRecipes(recipes) {

    const recipeList =
        document.getElementById(
            "recipeList"
        );


    recipeList.innerHTML = "";


    // --------------------------------------
    // NO RECIPES
    // --------------------------------------

    if (
        !recipes ||
        recipes.length === 0
    ) {

        recipeList.innerHTML = `

            <div class="result-item">

                <div class="item-text">

                    <strong>
                        No suitable recipes found
                    </strong>

                    <span class="macro-sub">
                        Try adding another ingredient
                        to your pantry.
                    </span>

                </div>

            </div>

        `;

        return;
    }


    // --------------------------------------
    // DISPLAY EACH RECIPE
    // --------------------------------------

    recipes.forEach(recipe => {

        const div =
            document.createElement("div");


        div.className =
            "recipe-card";


        // ==================================
        // INGREDIENTS
        // ==================================

        const ingredientsList =
            (recipe.ingredients || [])
                .map(item => {

                    const measure =
                        item.measure
                            ? ` - ${item.measure}`
                            : "";


                    return `

                        <li>
                            ${item.ingredient}${measure}
                        </li>

                    `;

                })
                .join("");


        // ==================================
        // INSTRUCTIONS
        // ==================================

        let instructionSteps = "";


        /*
            Local recipes use an ARRAY:

            [
                "Step one",
                "Step two"
            ]

            TheMealDB recipes use a STRING:

            "Step one\nStep two"
        */


        if (
            Array.isArray(
                recipe.instructions
            )
        ) {

            instructionSteps =
                recipe.instructions

                    .filter(
                        step =>
                            step &&
                            step.trim() !== ""
                    )

                    .map(
                        step => `

                            <li>
                                ${step.trim()}
                            </li>

                        `
                    )

                    .join("");

        } else {

            const instructionText =
                recipe.instructions || "";


            instructionSteps =
                instructionText

                    .split(/\r?\n/)

                    .filter(
                        step =>
                            step.trim() !== ""
                    )

                    .map(
                        step => `

                            <li>
                                ${step.trim()}
                            </li>

                        `
                    )

                    .join("");
        }


        // ==================================
        // RECIPE CARD
        // ==================================

        div.innerHTML = `

            <img
                src="${recipe.strMealThumb}"
                alt="${recipe.strMeal}"
                class="recipe-image"
            >


            <div class="recipe-content">

                <h3>
                    ${recipe.strMeal}
                </h3>


                <p class="recipe-info">

                    ${recipe.strCategory || "Recipe"}

                    ${
                        recipe.strArea
                            ? " • " + recipe.strArea
                            : ""
                    }

                </p>


                <h4>
                    🥗 Ingredients
                </h4>


                <ul class="recipe-ingredients">

                    ${ingredientsList}

                </ul>


                <h4>
                    👩‍🍳 How to Make
                </h4>


                <ol class="recipe-instructions">

                    ${instructionSteps}

                </ol>

            </div>

        `;


        recipeList.appendChild(div);

    });
}


// ==========================================
// INITIAL LOAD
// ==========================================

loadPantry();