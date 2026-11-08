// ========================================
// SHOOTER: MOUSE AIMING AND SHOT ANIMATION
// ========================================

export class Shooter {

    constructor(arena, shotLine) {

        this.arena = arena;
        this.shotLine = shotLine;
        this.element = document.getElementById("shooter");
        this.positionElement = document.getElementById("shooterPosition");
        this.aimGuide = document.getElementById("aimGuide");

        // 0 is the left edge, 0.5 is the middle, and 1 is the right edge.
        this.positionRatio = 0.5;
        this.lastShot = -Infinity;
        this.cooldown = 140;
    }


    // Keep the complete gun inside the arena, including at the edges.
    getPosition() {

        const padding = 28;
        const width = this.arena.clientWidth;

        let position = width * this.positionRatio;

        position = Math.min(width - padding, position);
        position = Math.max(padding, position);

        return position;
    }


    // Convert the pointer's browser position into an arena-local position.
    moveToPointer(event) {

        const bounds = this.arena.getBoundingClientRect();
        const localX = event.clientX - bounds.left - this.arena.clientLeft;

        this.positionRatio = localX / this.arena.clientWidth;
        this.positionRatio = Math.min(1, this.positionRatio);
        this.positionRatio = Math.max(0, this.positionRatio);

        this.updatePosition();
    }


    // Arrow-key movement provides an alternative to the mouse.
    moveBy(distance) {

        this.positionRatio = (this.getPosition() + distance) / this.arena.clientWidth;
        this.positionRatio = Math.min(1, this.positionRatio);
        this.positionRatio = Math.max(0, this.positionRatio);

        this.updatePosition();
    }


    // The gun, aim guide and shot must always share the same horizontal position.
    updatePosition() {

        const position = this.getPosition();
        const arenaHeight = this.arena.clientHeight;
        const gunWidth = this.element.offsetWidth;
        const gunHeight = this.element.offsetHeight;

        // Move the SVG container, not the gun's CSS styles.
        this.positionElement.setAttribute("x", position - gunWidth / 2);
        this.positionElement.setAttribute("y", arenaHeight - gunHeight - 24);

        this.shotLine.setAttribute("x1", position);
        this.shotLine.setAttribute("x2", position);
        this.shotLine.setAttribute("y1", arenaHeight - 60);
        this.shotLine.setAttribute("y2", 55);

        this.aimGuide.setAttribute("x1", position);
        this.aimGuide.setAttribute("x2", position);
        this.aimGuide.setAttribute("y1", 64);
        this.aimGuide.setAttribute("y2", arenaHeight - 70);
    }


    fire() {

        const now = performance.now();

        if (now - this.lastShot < this.cooldown) {
            return false;
        }

        this.lastShot = now;

        this.updatePosition();

        this.shotLine.classList.remove("firing");

        // Reading the SVG bounds allows the CSS animation to restart.
        this.shotLine.getBoundingClientRect();

        this.shotLine.classList.add("firing");

        return true;
    }


    reset() {

        this.positionRatio = 0.5;
        this.lastShot = -Infinity;

        this.shotLine.classList.remove("firing");

        this.updatePosition();
    }
}
