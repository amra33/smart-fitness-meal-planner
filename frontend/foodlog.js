const API_BASE = "http://localhost:5000";

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

loadFoodLogs();

// Default the meal-type dropdown to whatever's most likely right now,
// based on time of day — so people don't have to remember to change it
// on every single log, but can still override it when it's wrong.
function guessMealType() {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 16) return "lunch";
    if (hour < 19) return "snack";
    if (hour < 22) return "dinner";
    return "snack";
}
document.getElementById("mealTypeSelect").value = guessMealType();

// Sidebar personalization — foodlog.html doesn't load script.js, so this
// page needs its own copy of this fetch, reusing the token above.
const sidebarNameEl = document.getElementById("sidebarName");
const avatarEl = document.getElementById("avatarInitial");
if (sidebarNameEl || avatarEl) {
    fetch(`${API_BASE}/api/auth/profile`, {
        headers: { "Authorization": "Bearer " + token }
    })
    .then(response => response.json())
    .then(data => {
        if (data.user && data.user.name) {
            if (sidebarNameEl) sidebarNameEl.textContent = data.user.name;
            if (avatarEl) avatarEl.textContent = data.user.name.charAt(0).toUpperCase();
        }
    })
    .catch(error => console.error(error));
}

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

function macroSubtext(item) {
    const p = item.protein ?? "?";
    const c = item.carbs ?? "?";
    const f = item.fat ?? "?";
    const serving = item.serving ? `${item.serving} &middot; ` : "";
    return `${serving}P: ${p}g &middot; C: ${c}g &middot; F: ${f}g`;
}

function renderSearchResults(results) {
    const container = document.getElementById("searchResults");

    if (results.length === 0) {
        container.innerHTML = "<p>No matches found. Try a different search term (e.g. a simpler name or a different spelling).</p>";
        return;
    }

    container.innerHTML = results.map((food, index) => `
        <div class="result-item">
            <span class="item-text">
                <span>${food.foodName} — ${food.calories ?? "?"} kcal</span>
                <span class="macro-sub">${macroSubtext(food)}</span>
            </span>
            <button class="logBtn" data-index="${index}">Log this</button>
        </div>
    `).join("");

    container.querySelectorAll(".logBtn").forEach(button => {
        button.addEventListener("click", function () {
            const food = results[this.dataset.index];
            const mealType = document.getElementById("mealTypeSelect").value;
            saveFoodLog({
                foodName: food.foodName,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                servingSize: food.serving,
                mealType
            });
        });
    });
}

// Used by the "Log this" button on each search result
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

function dateKey(dateString) {
    return new Date(dateString).toISOString().split("T")[0];
}

async function loadFoodLogs() {
    try {
        const response = await fetch(`${API_BASE}/api/foodlogs`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await response.json();
        const logs = data.logs || [];

        // "Today's Log" should mean today — filter before rendering.
        const today = new Date().toISOString().split("T")[0];
        const todaysLogs = logs.filter(log => dateKey(log.date) === today);

        renderLogList(todaysLogs);
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
                <span class="item-text">
                    <span>${log.foodName} — ${log.calories} kcal</span>
                    <span class="macro-sub">
                        ${log.servingSize ? `${log.servingSize} &middot; ` : ""}P: ${log.protein ?? 0}g &middot; C: ${log.carbs ?? 0}g &middot; F: ${log.fat ?? 0}g
                    </span>
                </span>
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