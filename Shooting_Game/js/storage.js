// ========================================
// 1. BROWSER STORAGE KEYS
// ========================================

const USERS_KEY = "quadizArcadeUsers";
const SESSION_KEY = "quadizArcadeSession";

// This is a browser-only coursework demo, not secure authentication.
// Passwords remain in local storage: use demo passwords only.


// ========================================
// 2. READ AND SAVE USER DATA
// ========================================

// Get all registered users from JSON storage.
export function getUsers() {

    const savedUsers = localStorage.getItem(USERS_KEY);

    if (savedUsers === null) {
        return [];
    }

    const users = JSON.parse(savedUsers);

    // Do not overwrite unexpected data with a new user list.
    if (!Array.isArray(users)) {
        throw new Error("The saved user data is not a list.");
    }

    return users;
}


// Save users and their highest scores in JSON format.
export function saveUsers(users) {

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}


// ========================================
// 3. READ AND SAVE THE CURRENT SESSION
// ========================================

export function getSession() {

    const savedSession = localStorage.getItem(SESSION_KEY);

    if (savedSession === null) {
        return null;
    }

    let username;

    try {

        username = JSON.parse(savedSession);

    } catch (error) {

        // Older versions stored the username without JSON encoding.
        username = savedSession;
    }

    // Old usernames made only of digits can parse as numbers.
    // Old usernames such as "true" can parse as booleans.
    if (typeof username !== "string") {
        username = savedSession;
    }

    // Keep only sessions that belong to an existing account.
    const users = getUsers();

    for (const user of users) {

        if (user.username === username) {

            // Save older plain-text sessions in the current JSON format.
            saveSession(user.username);

            return user.username;
        }
    }

    // A deleted account must not keep a valid login session.
    localStorage.removeItem(SESSION_KEY);

    return null;
}


export function saveSession(username) {

    localStorage.setItem(SESSION_KEY, JSON.stringify(username));
}


// ========================================
// 4. REGISTER A NEW PLAYER
// ========================================

export function register(username, password, email, phone) {

    const users = getUsers();

    // Check usernames without treating capital letters as different names.
    for (const user of users) {

        if (user.username.toLowerCase() === username.toLowerCase()) {

            return {
                ok: false,
                message: "That player name is already taken."
            };
        }
    }

    // Older accounts may not have an email field; they still remain valid.
    for (const user of users) {

        if (typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase()) {

            return {
                ok: false,
                message: "That email is already registered."
            };
        }
    }

    // Each registered player starts with a highest score of zero.
    const newUser = {
        username: username,
        password: password,
        email: email,
        phone: phone,
        highScore: 0
    };

    users.push(newUser);

    saveUsers(users);

    // Automatically log in after registration.
    saveSession(username);

    return {
        ok: true,
        user: username
    };
}


// ========================================
// 5. LOG IN AN EXISTING PLAYER
// ========================================

export function login(username, password) {

    const users = getUsers();

    for (const user of users) {

        if (
            user.username.toLowerCase() === username.toLowerCase() &&
            user.password === password
        ) {

            saveSession(user.username);

            return {
                ok: true,
                user: user.username
            };
        }
    }

    return {
        ok: false,
        message: "Player name or password is incorrect."
    };
}


// ========================================
// 6. SAVE THE PLAYER'S HIGHEST SCORE
// ========================================

export function saveScore(score, username = getSession()) {

    // Scores must be non-negative whole numbers.
    if (!Number.isInteger(score) || score < 0) {
        return false;
    }

    // Guests can play, but their scores are not saved to an account.
    if (!username) {
        return false;
    }

    const users = getUsers();

    for (const user of users) {

        if (user.username === username) {

            // A lower score must not replace a personal best.
            if (score > user.highScore) {

                user.highScore = score;

                saveUsers(users);
            }

            return true;
        }
    }

    return false;
}


// ========================================
// 7. GET THE PLAYER'S HIGHEST SCORE
// ========================================

export function getHighScore(username = getSession()) {

    if (!username) {
        return 0;
    }

    const users = getUsers();

    for (const user of users) {

        if (user.username === username) {
            return user.highScore;
        }
    }

    return 0;
}


// ========================================
// 8. GET EVERY REGISTERED PLAYER'S RANKING
// ========================================

export function getRankings() {

    const users = getUsers();

    // slice() makes a copy so sorting does not change the saved user order.
    const rankings = users.slice();

    rankings.sort(function (firstPlayer, secondPlayer) {

        const scoreDifference = secondPlayer.highScore - firstPlayer.highScore;

        if (scoreDifference !== 0) {
            return scoreDifference;
        }

        // Use alphabetical order when players have the same score.
        return firstPlayer.username.localeCompare(secondPlayer.username);

    });

    return rankings;
}


// ========================================
// 9. LOG OUT THE CURRENT PLAYER
// ========================================

export function logout() {

    localStorage.removeItem(SESSION_KEY);
}
