const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const userData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            age: Number(document.getElementById("age").value),
            height: Number(document.getElementById("height").value),
            weight: Number(document.getElementById("weight").value),
            activityLevel: document.getElementById("activityLevel").value
        };

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(userData)
                }
            );

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);

                document.getElementById("registerMessage").textContent =
                    "Registration successful!";

                setTimeout(() => {
                    window.location.href = "profile.html";
                }, 1000);

            } else {
                document.getElementById("registerMessage").textContent =
                    data.message;
            }

        } catch (error) {
            document.getElementById("registerMessage").textContent =
                "Cannot connect to server.";
            console.error(error);
        }
    });
}
// PROFILE
const profileMessage = document.getElementById("message");

if (profileMessage) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
    } else {
        fetch("http://localhost:5000/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                document.getElementById("name").textContent = data.user.name;
                document.getElementById("email").textContent = data.user.email;
                document.getElementById("age").textContent = data.user.age;
                document.getElementById("height").textContent = data.user.height;
                document.getElementById("weight").textContent = data.user.weight;
                document.getElementById("activityLevel").textContent = data.user.activityLevel;

                // Sidebar personalization (new) — guarded so this never
                // breaks on pages that don't have these elements
                const sidebarNameEl = document.getElementById("sidebarName");
                if (sidebarNameEl) sidebarNameEl.textContent = data.user.name;

                const avatarEl = document.getElementById("avatarInitial");
                if (avatarEl && data.user.name) {
                    avatarEl.textContent = data.user.name.charAt(0).toUpperCase();
                }

            } else {
                profileMessage.textContent = data.message;
            }
        })
        .catch(error => {
            console.error(error);
            profileMessage.textContent = "Cannot connect to server.";
        });
    }
}
// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);

                document.getElementById("loginMessage").textContent =
                    "Login successful!";

                setTimeout(() => {
                    window.location.href = "profile.html";
                }, 1000);
            } else {
                document.getElementById("loginMessage").textContent =
                    data.message;
            }

        } catch (error) {
            console.error(error);

            document.getElementById("loginMessage").textContent =
                "Cannot connect to server.";
        }
    });
}
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}