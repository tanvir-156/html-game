// ========================================
// GAME: ROUND STATES AND CLASS COORDINATION
// ========================================

import { Countdown } from "./Countdown.js?rev=larger-buttons-20261101-10";
import { Target } from "./Target.js?rev=larger-buttons-20261101-10";
import { Shooter } from "./Shooter.js?rev=larger-buttons-20261101-10";
import { ScoreBoard } from "./ScoreBoard.js?rev=larger-buttons-20261101-10";
import { LevelManager } from "./LevelManager.js?rev=larger-buttons-20261101-10";


export class Game {

    constructor(soundManager) {

        this.soundManager = soundManager;
        this.arena = document.getElementById("arena");
        this.message = document.getElementById("gameMessage");
        this.messageTitle = document.getElementById("messageTitle");
        this.messageText = document.getElementById("messageText");
        this.actionButton = document.getElementById("startButton");
        this.hitFlash = document.getElementById("hitFlash");

        this.countdown = new Countdown();
        this.scoreBoard = new ScoreBoard();
        this.levelManager = new LevelManager();
        this.shooter = new Shooter(this.arena, document.getElementById("shotLine"));

        this.targets = [];
        this.player = null;
        this.secondsLeft = 60;
        // ready = title, countdown = 3/2/1, running = playing.
        // paused, level-up and over show an overlay inside the arena.
        this.state = "ready";
        this.resumeCountdown = false;
        this.hasStarted = false;
        this.frameId = null;
        this.lastTime = 0;

        // The arrow function keeps "this" pointing to this Game object.
        this.frame = (time) => {

            this.update(time);

        };

        this.connectControls();
    }


    // ========================================
    // 1. ENTER AND START A ROUND
    // ========================================

    enter(player) {

        this.player = player;

        this.start();
    }


    start() {

        this.stopLoop();
        this.countdown.cancel();

        this.resumeCountdown = false;
        this.hasStarted = false;

        this.secondsLeft = 60;

        this.scoreBoard.reset(this.player);
        this.levelManager.reset();
        this.shooter.reset();

        this.applyLevel();
        this.setState("countdown");
        this.render();

        this.beginCountdown();
    }


    // Start and replay both wait for 3, 2 and 1 before gameplay begins.
    beginCountdown() {

        this.stopLoop();

        this.setState("countdown");

        this.arena.focus({ preventScroll: true });

        this.countdown.start(

            (number) => {

                this.showCountdown(number);

            },

            () => {

                if (this.state !== "countdown") {
                    return;
                }

                this.hasStarted = true;

                this.resume();

            }

        );
    }


    resume() {

        // If the intro countdown was paused, restart it from three.
        if (this.resumeCountdown) {

            this.resumeCountdown = false;

            this.beginCountdown();

            return;
        }

        this.countdown.cancel();

        this.message.classList.remove("countdown-message");
        this.messageTitle.classList.remove("countdown-pulse");
        this.message.removeAttribute("aria-live");
        this.actionButton.classList.remove("hidden");

        this.message.classList.add("is-hidden");

        this.setState("running");

        this.lastTime = performance.now();

        this.stopLoop();

        this.frameId = requestAnimationFrame(this.frame);

        this.arena.focus({ preventScroll: true });
    }


    // ========================================
    // 2. UPDATE MOVEMENT AND THE ROUND CLOCK
    // ========================================

    update(time) {

        this.frameId = null;

        if (this.state !== "running") {
            return;
        }

        const elapsed = Math.max(0, (time - this.lastTime) / 1000);

        this.lastTime = time;

        this.secondsLeft = Math.max(0, this.secondsLeft - elapsed);

        // Cap movement steps while keeping the clock based on real elapsed time.
        const movementTime = Math.min(elapsed, 0.05);

        for (const target of this.targets) {
            target.update(movementTime);
        }

        this.shooter.updatePosition();

        this.render();

        if (this.secondsLeft <= 0) {

            this.finish("Time is up!");

            return;
        }

        this.frameId = requestAnimationFrame(this.frame);
    }


    // ========================================
    // 3. FIRE FROM THE GUN'S CURRENT POSITION
    // ========================================

    shoot() {

        if (this.state !== "running" || !this.shooter.fire()) {
            return;
        }

        this.soundManager.play("shoot");

        const shooterX = this.shooter.getPosition();

        // If several targets line up, hit the one closest to the gun.
        let targetToHit = null;

        for (const target of this.targets) {

            if (target.canBeHit(shooterX)) {

                if (targetToHit === null || target.y > targetToHit.y) {
                    targetToHit = target;
                }
            }
        }

        if (targetToHit !== null) {

            targetToHit.hit();

            this.scoreBoard.addHit();

            this.soundManager.play("hit");

            this.hitFlash.classList.remove("flash");

            // Reading the width restarts the hit animation on the next line.
            this.hitFlash.offsetWidth;

            this.hitFlash.classList.add("flash");

            if (this.levelManager.advance(this.scoreBoard.score)) {
                this.levelUp();
            }

        } else {

            this.scoreBoard.loseLife();

            if (this.scoreBoard.lives === 0) {
                this.finish("Out of lives!");
            }
        }

        this.render();
    }


    // ========================================
    // 4. CHANGE THE LEVEL AND TARGETS
    // ========================================

    applyLevel() {

        for (const target of this.targets) {
            target.destroy();
        }

        const configuration = this.levelManager.getConfiguration();

        this.targets = [];

        // The external CSS chooses the colours and sprite size for this level.
        this.arena.setAttribute("data-level", configuration.number);

        for (let i = 0; i < configuration.targetCount; i++) {

            this.targets.push(new Target(this.arena, configuration, i));
        }
    }


    levelUp() {

        this.stopLoop();

        this.setState("level-up");

        this.applyLevel();

        const configuration = this.levelManager.getConfiguration();

        this.showMessage(
            "Level " + configuration.number,
            configuration.targetCount + " targets",
            "Continue"
        );

        this.render();
    }


    // ========================================
    // 5. PAUSE, FINISH OR QUIT
    // ========================================

    pause() {

        if (this.state !== "running" && this.state !== "countdown") {
            return;
        }

        this.resumeCountdown = this.state === "countdown";

        this.countdown.cancel();
        this.stopLoop();

        this.setState("paused");

        this.showMessage("Paused", "", "Resume");
    }


    finish(title, playSound = true) {

        if (this.state === "over" || this.state === "ready") {
            return;
        }

        this.countdown.cancel();
        this.stopLoop();

        this.resumeCountdown = false;

        this.setState("over");

        this.scoreBoard.save();

        if (playSound) {
            this.soundManager.play("gameOver");
        }

        this.showMessage(
            title,
            "Score " + this.scoreBoard.score + " · Level " + this.levelManager.level,
            "Play again"
        );

        this.render();
    }


    quit() {

        this.countdown.cancel();

        this.resumeCountdown = false;

        // Do not save a round that was cancelled before its countdown finished.
        if (this.hasStarted && this.state !== "ready" && this.state !== "over") {
            this.finish("Round ended", false);
        }

        this.stopLoop();

        this.setState("ready");

        document.dispatchEvent(new CustomEvent("arcade:menu"));
    }


    // ========================================
    // 6. UPDATE THE MINIMAL INTERFACE
    // ========================================

    setState(state) {

        this.state = state;

        this.arena.classList.toggle("is-running", state === "running");
    }


    showMessage(title, text, buttonText) {

        this.message.classList.remove("countdown-message");
        this.messageTitle.classList.remove("countdown-pulse");
        this.message.removeAttribute("aria-live");
        this.actionButton.classList.remove("hidden");

        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.actionButton.textContent = buttonText;

        this.message.classList.remove("is-hidden");

        this.actionButton.focus({ preventScroll: true });
    }


    // Keep the countdown clean: one large number and no extra button.
    showCountdown(number) {

        this.messageTitle.textContent = String(number);
        this.messageText.textContent = "";

        this.actionButton.classList.add("hidden");

        this.message.classList.add("countdown-message");
        this.message.classList.remove("is-hidden");
        this.message.setAttribute("aria-live", "polite");

        this.messageTitle.classList.remove("countdown-pulse");

        // Restart the number animation, even when the text uses the same class.
        this.messageTitle.offsetWidth;

        this.messageTitle.classList.add("countdown-pulse");
    }


    render() {

        this.scoreBoard.render(
            this.secondsLeft,
            this.levelManager.getConfiguration()
        );

        if (this.state === "over") {
            document.getElementById("timerValue").textContent = "ROUND OVER";
        }
    }


    stopLoop() {

        if (this.frameId !== null) {

            cancelAnimationFrame(this.frameId);

            this.frameId = null;
        }
    }


    // ========================================
    // 7. MOUSE, TOUCH AND KEYBOARD CONTROLS
    // ========================================

    connectControls() {

        this.actionButton.addEventListener("click", () => {

            if (this.state === "over") {

                this.start();

            } else if (this.state === "paused" || this.state === "level-up") {

                this.resume();
            }

        });

        document.getElementById("quitButton").addEventListener("click", () => {

            this.quit();

        });

        this.arena.addEventListener("pointermove", (event) => {

            if (this.state === "running") {
                this.shooter.moveToPointer(event);
            }

        });

        this.arena.addEventListener("pointerdown", (event) => {

            // Overlay buttons keep their own normal click behaviour.
            if (this.state !== "running" || event.button !== 0 || event.target.closest("button, a")) {
                return;
            }

            this.arena.focus({ preventScroll: true });

            this.shooter.moveToPointer(event);

            this.shoot();

        });

        document.addEventListener("keydown", (event) => {

            this.handleKeyPress(event);

        });

        document.addEventListener("visibilitychange", () => {

            if (document.hidden) {
                this.pause();
            }

        });

        window.addEventListener("resize", () => {

            if (this.state !== "ready") {

                this.shooter.updatePosition();

                for (const target of this.targets) {
                    target.updatePosition();
                }
            }

        });
    }


    // Keep keyboard rules separate from the mouse and touch listeners.
    handleKeyPress(event) {

        if (event.code === "Escape") {

            if (this.state === "running" || this.state === "countdown") {

                this.pause();

            } else if (this.state === "paused") {

                this.resume();
            }

            return;
        }

        if (event.code === "KeyM" && !event.repeat && this.state !== "ready") {

            this.soundManager.toggle();

            return;
        }

        // Quit and overlay buttons must remain usable with the keyboard.
        if (event.target.closest("button, a, input")) {
            return;
        }

        if (event.code === "Space" && this.state === "running") {

            event.preventDefault();

            this.shoot();
        }

        if (event.code === "ArrowLeft" && this.state === "running") {

            event.preventDefault();

            this.shooter.moveBy(-24);
        }

        if (event.code === "ArrowRight" && this.state === "running") {

            event.preventDefault();

            this.shooter.moveBy(24);
        }
    }

}
