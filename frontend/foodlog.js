const API_BASE = "http://localhost:5000";

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

loadFoodLogs();

// SEARCH
document.getElementById("searchBtn").addEventListener("click", async function () {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;

    try {
        const response = await fetch(
            `${API_BASE}/api/nutrition/search?query=${encodeURIComponent(query)}`,
            { headers: { "Authorization": "Bearer " + token } }
        );
        const data = await response.json();
        renderSearchResults(data.results || []);
    } catch (error) {
        console.error(error);
        document.getElementById("searchResults").textContent = "Cannot connect to server.";
    }
});

function renderSearchResults(results) {
    const container = document.getElementById("searchResults");

    if (results.length === 0) {
        container.innerHTML = "<p>No matches found. Try entering it manually below.</p>";
        return;
    }

    container.innerHTML = results.map((food, index) => `
        <div class="result-item">
            <span>${food.foodName} — ${food.calories ?? "?"} kcal</span>
            <button class="logBtn" data-index="${index}">Log this</button>
        </div>
    `).join("");

    container.querySelectorAll(".logBtn").forEach(button => {
        button.addEventListener("click", function () {
            const food = results[this.dataset.index];
            saveFoodLog({
                foodName: food.foodName,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat
            });
        });
    });
}

// MANUAL ENTRY
document.getElementById("showManualBtn").addEventListener("click", function () {
    const section = document.getElementById("manualEntry");
    section.style.display = section.style.display === "none" ? "block" : "none";
});

document.getElementById("manualSaveBtn").addEventListener("click", function () {
    const foodName = document.getElementById("manualFoodName").value.trim();
    const calories = Number(document.getElementById("manualCalories").value);
    const mealType = document.getElementById("manualMealType").value;

    if (!foodName || !calories) {
        alert("Please enter a food name and calorie amount.");
        return;
    }

    saveFoodLog({ foodName, calories, mealType });
});

// Shared by both search results and manual entry
async function saveFoodLog(logData) {
    try {
        const response = await fetch(`${API_BASE}/api/foodlogs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(logData)
        });

        const data = await response.json();

        if (response.ok) {
            loadFoodLogs();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert("Cannot connect to server.");
    }
}

async function loadFoodLogs() {
    try {
        const response = await fetch(`${API_BASE}/api/foodlogs`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await response.json();
        renderLogList(data.logs || []);
    } catch (error) {
        console.error(error);
    }
}

function renderLogList(logs) {
    const container = document.getElementById("logList");

    if (logs.length === 0) {
        container.innerHTML = "<p>No food logged yet today.</p>";
        return;
    }

    const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);

    container.innerHTML = `
        <p><strong>Total: ${totalCalories} kcal</strong></p>
        ${logs.map(log => `
            <div class="log-item">
                <span>${log.foodName} — ${log.calories} kcal</span>
                <button class="deleteBtn" data-id="${log._id}">Delete</button>
            </div>
        `).join("")}
    `;

    container.querySelectorAll(".deleteBtn").forEach(button => {
        button.addEventListener("click", function () {
            deleteFoodLog(this.dataset.id);
        });
    });
}

async function deleteFoodLog(id) {
    try {
        await fetch(`${API_BASE}/api/foodlogs/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        loadFoodLogs();
    } catch (error) {
        console.error(error);
    }
}