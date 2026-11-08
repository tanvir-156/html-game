// ========================================
// MENU: TITLE ANIMATION AND SAVED LOGIN
// ========================================

import { getSession, logout } from "../storage.js?rev=larger-buttons-20261101-10";


export class Menu {

    constructor(game) {

        this.game = game;
        this.welcomeScreen = document.getElementById("welcomeScreen");
        this.gameScreen = document.getElementById("gameScreen");

        this.choices = document.getElementById("splashChoices");
        this.navigation = document.getElementById("siteNavigation");
        this.guestChoices = document.getElementById("guestChoices");
        this.memberChoices = document.getElementById("memberChoices");
        this.startButton = document.getElementById("titleStartButton");
        this.guestButton = document.getElementById("guestButton");
        this.logoutButton = document.getElementById("titleLogoutButton");
        this.rankingsLink = document.getElementById("rankingsLink");
        this.title = document.getElementById("welcomeTitle");
        this.message = document.getElementById("menuMessage");

        this.introTimer = null;
        this.introFinished = false;

        this.connectControls();

        // Every page visit starts with the animation, not an automatic round.
        // Older links containing ?play=1 also follow this same title flow.
        this.showWelcome(true);
    }


    // ========================================
    // 1. READ THE PERSISTENT LOGIN
    // ========================================

    getPlayer() {

        try {

            return getSession();

        } catch (error) {

            this.message.textContent = "Saved login is unavailable. You can still play as a guest.";

            return null;
        }
    }


    // ========================================
    // 2. SHOW ONLY THE CORRECT PLAYER OPTIONS
    // ========================================

    updateChoices(focus = false) {

        const player = this.getPlayer();
        const loggedIn = Boolean(player);
        const gameIsVisible = !this.gameScreen.classList.contains("hidden");
        const hideNavigation = !this.introFinished || gameIsVisible;

        this.guestChoices.classList.toggle("hidden", loggedIn);
        this.memberChoices.classList.toggle("hidden", !loggedIn);

        // No options are visible until the title animation has finished.
        this.choices.classList.toggle("hidden", !this.introFinished);
        this.navigation.classList.toggle("hidden", hideNavigation);

        // Account links remain hidden until the player logs out.
        for (const link of this.navigation.querySelectorAll("[data-guest-link]")) {
            link.classList.toggle("hidden", loggedIn);
        }

        // Rankings are available only while an account is signed in.
        this.rankingsLink.classList.toggle("hidden", !loggedIn);

        this.logoutButton.classList.toggle("hidden", !loggedIn);

        if (focus && this.introFinished) {

            if (player) {

                this.startButton.focus();

            } else {

                this.guestButton.focus();
            }
        }
    }


    // ========================================
    // 3. PLAY THE TITLE ANIMATION
    // ========================================

    showWelcome(animate = false) {

        clearTimeout(this.introTimer);

        this.gameScreen.classList.add("hidden");
        this.welcomeScreen.classList.remove("hidden");
        this.welcomeScreen.classList.toggle("is-intro", animate);

        document.body.classList.add("title-mode");

        this.message.textContent = "";
        this.introFinished = !animate;

        this.updateChoices(!animate);

        if (animate) {

            this.title.focus();

            this.introTimer = setTimeout(() => {

                this.welcomeScreen.classList.remove("is-intro");

                this.introFinished = true;

                // Read the session again in case it changed during the animation.
                this.updateChoices();

            }, 3000);
        }
    }


    // ========================================
    // 4. ENTER THE ARENA ONLY AFTER START
    // ========================================

    showGame(player) {

        clearTimeout(this.introTimer);

        this.welcomeScreen.classList.add("hidden");
        this.gameScreen.classList.remove("hidden");

        // Keep title navigation out of countdowns, rounds and pause screens.
        this.navigation.classList.add("hidden");

        document.body.classList.remove("title-mode");

        this.game.enter(player);
    }


    // ========================================
    // 5. LOG OUT WITHOUT DELETING ACCOUNTS
    // ========================================

    logOutPlayer() {

        try {

            // Save an active round before logging its player out.
            if (!this.gameScreen.classList.contains("hidden")) {
                this.game.quit();
            }

            // Remove only the session; keep users and their saved scores.
            logout();

        } catch (error) {

            this.message.textContent = "Could not log out. Check browser storage.";

            return;
        }

        this.showWelcome();
    }


    // ========================================
    // 6. CONNECT START, GUEST, LOGOUT AND QUIT
    // ========================================

    connectControls() {

        this.startButton.addEventListener("click", () => {

            const player = this.getPlayer();

            // Recheck the session instead of trusting an old visible button.
            if (!player) {

                this.updateChoices(true);

                return;
            }

            this.showGame(player);

        });

        this.guestButton.addEventListener("click", () => {

            // A player signed in in another tab must use Start, not Guest.
            if (this.getPlayer()) {

                this.updateChoices(true);

                return;
            }

            this.showGame(null);

        });

        this.logoutButton.addEventListener("click", () => {

            this.logOutPlayer();

        });

        document.addEventListener("arcade:menu", () => {

            // Quit returns to Start while the saved login remains active.
            this.showWelcome();

        });

        // Safely finish a round if a title link is triggered programmatically.
        for (const link of this.navigation.querySelectorAll("a")) {

            link.addEventListener("click", (event) => {

                // Opening a separate tab should not end the current round.
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
                    return;
                }

                if (!this.gameScreen.classList.contains("hidden")) {
                    this.game.quit();
                }

            });

        }

        // Another tab's login/logout updates the visible title choices too.
        window.addEventListener("storage", (event) => {

            if (event.key === "quadizArcadeSession" || event.key === "quadizArcadeUsers" || event.key === null) {

                this.updateChoices();
            }

        });
    }
}
