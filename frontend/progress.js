const API_BASE = "http://localhost:5000";

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

let allLogs = [];
const todayStr = new Date().toISOString().split("T")[0];

loadProgress();

async function loadProgress() {
    try {
        const response = await fetch(`${API_BASE}/api/foodlogs`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await response.json();
        allLogs = data.logs || [];

        renderWeekChart(allLogs);

        const dateInput = document.getElementById("dateSelect");
        dateInput.max = todayStr;
        dateInput.value = todayStr;
        dateInput.addEventListener("change", function () {
            showDate(this.value);
        });

        showDate(todayStr);
    } catch (error) {
        console.error(error);
    }
}

function dateKey(dateString) {
    return new Date(dateString).toISOString().split("T")[0];
}

function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Central function: given a date string, filter the already-fetched logs
// and re-render everything (hero card + breakdown) to match that day.
function showDate(dateStr) {
    const logsForDay = allLogs.filter(log => dateKey(log.date) === dateStr);
    const isToday = dateStr === todayStr;

    document.getElementById("heroDateLabel").textContent =
        isToday ? "today" : `on ${formatDisplayDate(dateStr)}`;
    document.getElementById("breakdownHeading").textContent =
        isToday ? "Today's Breakdown" : `${formatDisplayDate(dateStr)} Breakdown`;

    renderHeroCard(logsForDay);
    renderMealBreakdown(logsForDay);

    const dateInput = document.getElementById("dateSelect");
    if (dateInput.value !== dateStr) dateInput.value = dateStr;

    document.querySelectorAll(".bar-row").forEach(row => {
        row.classList.toggle("bar-row-active", row.dataset.date === dateStr);
    });
}

function renderWeekChart(logs) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
    }

    const totals = {};
    days.forEach(day => totals[day] = 0);

    logs.forEach(log => {
        const key = dateKey(log.date);
        if (key in totals) {
            totals[key] += log.calories || 0;
        }
    });

    const maxCalories = Math.max(...Object.values(totals), 1);

    document.getElementById("weekChart").innerHTML = days.map(day => {
        const calories = totals[day];
        const widthPercent = (calories / maxCalories) * 100;
        const label = new Date(day + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });

        return `
            <div class="bar-row" data-date="${day}">
                <span class="bar-label">${label}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${widthPercent}%"></div>
                </div>
                <span class="bar-value">${calories} kcal</span>
            </div>
        `;
    }).join("");

    // Clicking a day's bar jumps the whole page to that day
    document.querySelectorAll(".bar-row").forEach(row => {
        row.addEventListener("click", function () {
            showDate(this.dataset.date);
        });
    });
}

function renderHeroCard(logsForDay) {
    const totalCalories = logsForDay.reduce((sum, log) => sum + (log.calories || 0), 0);
    document.getElementById("ringCalories").textContent = totalCalories;

    const totals = { protein: 0, carbs: 0, fat: 0 };
    logsForDay.forEach(log => {
        totals.protein += log.protein || 0;
        totals.carbs += log.carbs || 0;
        totals.fat += log.fat || 0;
    });

    const proteinCal = totals.protein * 4;
    const carbsCal = totals.carbs * 4;
    const fatCal = totals.fat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;

    const pct = (cal) => totalMacroCal > 0 ? Math.round((cal / totalMacroCal) * 100) : 0;

    setRing("proteinRing", pct(proteinCal));
    setRing("carbsRing", pct(carbsCal));
    setRing("fatRing", pct(fatCal));
}

function setRing(id, percent) {
    const ring = document.getElementById(id);
    if (!ring) return;
    ring.style.setProperty("--pct", percent);
    const valueEl = ring.querySelector(".macro-ring-value");
    if (valueEl) valueEl.textContent = percent + "%";
}

function renderMealBreakdown(logsForDay) {
    const mealTotals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };

    logsForDay.forEach(log => {
        const type = log.mealType || "snack";
        if (type in mealTotals) mealTotals[type] += log.calories || 0;
    });

    document.getElementById("mealBreakdown").innerHTML = Object.entries(mealTotals).map(([type, calories]) => `
        <div class="meal-row">
            <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span>${calories} kcal</span>
        </div>
    `).join("");
}