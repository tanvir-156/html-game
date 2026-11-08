// ========================================
// SCOREBOARD: SCORE, LIVES, TIME AND SAVING
// ========================================

import { getHighScore, saveScore } from "../storage.js?rev=larger-buttons-20261101-10";


export class ScoreBoard {

    constructor() {

        this.scoreValue = document.getElementById("scoreValue");
        this.bestValue = document.getElementById("bestValue");
        this.livesValue = document.getElementById("livesValue");
        this.timerValue = document.getElementById("timerValue");
        this.levelBadge = document.getElementById("levelBadge");
        this.scoreMessage = document.getElementById("scoreMessage");

        this.score = 0;
        this.lives = 3;
        this.best = 0;
        this.player = null;
    }


    // Keep the round's player identity fixed, even if another tab logs in.
    reset(player) {

        this.player = player;
        this.score = 0;
        this.lives = 3;
        this.best = 0;

        this.scoreMessage.textContent = "";
        this.scoreMessage.classList.remove("success");

        try {

            this.best = getHighScore(player);

        } catch (error) {

            this.scoreMessage.textContent = "Saved scores are unavailable. You can still play.";
        }
    }


    addHit() {

        this.score++;
    }


    loseLife() {

        this.lives = Math.max(0, this.lives - 1);
    }


    // Only this class updates the statistics shown on the game screen.
    render(secondsLeft, configuration) {

        this.scoreValue.textContent = String(this.score).padStart(2, "0");

        const bestScore = Math.max(this.best, this.score);

        this.bestValue.textContent = String(bestScore).padStart(2, "0");

        const fullHearts = "♥ ".repeat(this.lives);
        const emptyHearts = "♡ ".repeat(3 - this.lives);

        this.livesValue.textContent = fullHearts + emptyHearts;

        this.livesValue.setAttribute("aria-label", this.lives + " lives remaining");

        const secondsToShow = Math.ceil(Math.max(0, secondsLeft));

        this.timerValue.textContent = secondsToShow + " SEC";

        this.levelBadge.textContent = "LEVEL " + configuration.number;
    }


    // Store the best score as JSON through the shared storage module.
    save() {

        try {

            const saved = saveScore(this.score, this.player);

            // Save silently to keep the arena free of extra messages.
            this.scoreMessage.textContent = "";

            if (saved) {
                this.best = Math.max(this.best, this.score);
            }

        } catch (error) {

            this.scoreMessage.classList.remove("success");

            this.scoreMessage.textContent = "The score could not be saved. Check local storage and saved data.";
        }

        document.dispatchEvent(new CustomEvent("arcade:score-updated"));
    }
}
