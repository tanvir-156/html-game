// This file is used by Login, Register and Rankings.
import {
    getSession,
    getRankings,
    register,
    login
} from "./storage.js?rev=larger-buttons-20261101-10";


// ========================================
// 1. GET THE PAGE ELEMENTS
// ========================================

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const leaderboardBody = document.getElementById("leaderboardBody");
const leaderboardNote = document.getElementById("leaderboardNote");


// ========================================
// 2. SHOW RANKINGS
// ========================================

function showRankingMessage(text) {

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 3;
    cell.className = "empty-ranking";
    cell.textContent = text;

    row.appendChild(cell);
    leaderboardBody.appendChild(row);
}


function addRankingRow(player, position) {

    const row = document.createElement("tr");
    const rankCell = document.createElement("td");
    const nameCell = document.createElement("td");
    const scoreCell = document.createElement("td");

    rankCell.className = "rank-number";
    rankCell.textContent = String(position).padStart(2, "0");

    // textContent displays a name as text, not as HTML code.
    nameCell.className = "player-name";
    nameCell.textContent = player.username;

    scoreCell.className = "rank-score";
    scoreCell.textContent = player.highScore + " pts";

    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);

    leaderboardBody.appendChild(row);
}


function renderRankings() {

    // Login and Register do not have a rankings table.
    if (!leaderboardBody || !leaderboardNote) {
        return;
    }

    leaderboardBody.textContent = "";
    leaderboardNote.textContent = "";

    let players;

    try {

        if (!getSession()) {

            window.location.replace("login.html");

            return;
        }

        players = getRankings();

    } catch (error) {

        showRankingMessage("Saved rankings could not be loaded.");
        leaderboardNote.textContent = "Check browser storage.";

        return;
    }

    if (players.length === 0) {

        showRankingMessage("No players yet.");

        return;
    }

    // Include every player, even if their best score is zero.
    for (let index = 0; index < players.length; index++) {
        addRankingRow(players[index], index + 1);
    }
}


// ========================================
// 3. CHECK EMAIL AND PHONE NUMBERS
// ========================================

function isValidEmail(email) {

    if (email.length > 254 || /\s/.test(email)) {
        return false;
    }

    const parts = email.split("@");

    if (parts.length !== 2) {
        return false;
    }

    const localPart = parts[0];
    const domain = parts[1];

    // These are the characters allowed before the @ symbol.
    const allowedLocalCharacters = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;

    if (localPart.length > 64 || !allowedLocalCharacters.test(localPart)) {
        return false;
    }

    if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
        return false;
    }

    // For example, example.com has two domain parts: example and com.
    const domainParts = domain.split(".");

    if (domainParts.length < 2) {
        return false;
    }

    for (const part of domainParts) {

        if (!/^[A-Za-z0-9-]+$/.test(part)) {
            return false;
        }

        if (part.startsWith("-") || part.endsWith("-")) {
            return false;
        }
    }

    return true;
}


function isValidPhone(phone) {

    // Allow a leading + and common separators, but no letters.
    if (!/^\+?[0-9 ()-]+$/.test(phone)) {
        return false;
    }

    const digits = phone.replace(/\D/g, "");

    if (digits.length < 7 || digits.length > 15 || phone.length > 32) {
        return false;
    }

    return true;
}


// ========================================
// 4. SHOW AND CHECK FORM ERRORS
// ========================================

function showFormError(input, message, text) {

    message.textContent = text;
    input.setAttribute("aria-invalid", "true");
    input.focus();
}


function checkPlayerDetails(usernameInput, passwordInput, message) {

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "") {

        showFormError(usernameInput, message, "Please enter your player name.");

        return false;
    }

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {

        showFormError(usernameInput, message, "Use 3–16 letters, numbers or underscores for your player name.");

        return false;
    }

    if (password.trim() === "") {

        showFormError(passwordInput, message, "Please enter your password.");

        return false;
    }

    if (password.length < 6 || password.length > 64) {

        showFormError(passwordInput, message, "Password must be between 6 and 64 characters.");

        return false;
    }

    return true;
}


// ========================================
// 5. CONNECT A LOGIN OR REGISTER FORM
// ========================================

function connectForm(form, pageName) {

    if (!form) {
        return;
    }

    // pageName is either "login" or "register" and matches the HTML IDs.
    const usernameInput = document.getElementById(pageName + "Username");
    const passwordInput = document.getElementById(pageName + "Password");
    const message = document.getElementById(pageName + "Message");

    // Link each input to the error message for screen readers.
    for (const input of form.querySelectorAll("input")) {
        input.setAttribute("aria-describedby", message.id);
    }

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        message.textContent = "";
        message.classList.remove("success");

        for (const input of form.querySelectorAll("[aria-invalid]")) {
            input.removeAttribute("aria-invalid");
        }

        if (!checkPlayerDetails(usernameInput, passwordInput, message)) {
            return;
        }

        const username = usernameInput.value.trim();

        // Keep the password exactly as typed, including intentional spaces.
        const password = passwordInput.value;

        let email = "";
        let phone = "";

        if (pageName === "register") {

            const emailInput = document.getElementById("registerEmail");
            const phoneInput = document.getElementById("registerPhone");

            email = emailInput.value.trim().toLowerCase();
            phone = phoneInput.value.trim();

            if (!isValidEmail(email)) {

                showFormError(emailInput, message, "Enter a valid email address.");

                return;
            }

            if (!isValidPhone(phone)) {

                showFormError(phoneInput, message, "Enter a phone number with 7–15 digits.");

                return;
            }
        }

        try {

            let result;

            if (pageName === "register") {

                result = register(username, password, email, phone);

            } else {

                result = login(username, password);
            }

            if (!result.ok) {

                message.textContent = result.message;

                return;
            }

        } catch (error) {

            message.textContent = "The account could not be loaded or saved. Check local storage and saved data.";

            return;
        }

        form.reset();
        window.location.replace("index.html");

    });
}


// ========================================
// 6. SET UP THE CURRENT PAGE
// ========================================

function setupPage() {

    connectForm(registerForm, "register");
    connectForm(loginForm, "login");

    // Signed-in players use Start rather than visiting the account forms.
    if (registerForm || loginForm) {

        try {

            if (getSession()) {

                window.location.replace("index.html");

                return;
            }

        } catch (error) {

            // The form will show a storage error if it is submitted.
        }
    }

    renderRankings();

    document.addEventListener("arcade:score-updated", renderRankings);
    window.addEventListener("storage", renderRankings);

    window.addEventListener("pageshow", function (event) {

        // A cached page must recheck the login before showing rankings.
        if (event.persisted) {
            renderRankings();
        }

    });
}

setupPage();
