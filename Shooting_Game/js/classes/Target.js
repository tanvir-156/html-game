// ========================================
// TARGET: MOVEMENT, HIT TESTING AND SPRITE
// ========================================

export class Target {

    constructor(arena, configuration, index) {

        this.arena = arena;
        this.scene = document.getElementById("gameScene");
        this.index = index;
        this.count = configuration.targetCount;
        this.size = configuration.targetSize;
        this.speed = configuration.targetSpeed * (1 + index * 0.04);
        this.direction = 1;

        // Neighbouring targets start by moving in opposite directions.
        if (index % 2 !== 0) {
            this.direction = -1;
        }
        this.hiddenTime = 0;

        const fraction = (index + 1) / (this.count + 1);

        this.x = arena.clientWidth * fraction;
        this.y = 0;

        // An SVG container provides x/y coordinates for the HTML sprite.
        const svgNamespace = "http://www.w3.org/2000/svg";

        this.positionElement = document.createElementNS(svgNamespace, "foreignObject");
        this.positionElement.setAttribute("class", "target-position");
        this.positionElement.setAttribute("width", this.size);
        this.positionElement.setAttribute("height", this.size);

        this.element = document.createElement("div");
        this.element.className = "target target-sprite target-delay-" + index;
        this.element.setAttribute("aria-hidden", "true");

        this.positionElement.appendChild(this.element);
        this.scene.appendChild(this.positionElement);

        this.updatePosition();
    }


    // Keep targets in separate lanes, above the shooter.
    updatePosition() {

        const width = this.arena.clientWidth;
        const height = this.arena.clientHeight;
        const edge = this.size / 2 + 8;

        this.x = Math.min(width - edge, this.x);
        this.x = Math.max(edge, this.x);

        if (this.count === 1) {

            this.y = height * 0.34;

        } else {

            const availableHeight = Math.max(0, height - 210);

            this.y = 80 + this.index * availableHeight / (this.count - 1);
        }

        // x and y are the centre of the target; SVG uses its top-left corner.
        this.positionElement.setAttribute("x", this.x - this.size / 2);
        this.positionElement.setAttribute("y", this.y - this.size / 2);
    }


    // Movement uses elapsed seconds rather than a fixed number of pixels per frame.
    update(seconds) {

        if (this.hiddenTime > 0) {

            this.hiddenTime = Math.max(0, this.hiddenTime - seconds);

            this.element.classList.toggle("is-hit-hidden", this.hiddenTime > 0);
        }

        this.x = this.x + this.direction * this.speed * seconds;

        const edge = this.size / 2 + 8;
        const maxX = this.arena.clientWidth - edge;

        if (this.x >= maxX) {

            this.x = maxX;
            this.direction = -1;
        }

        if (this.x <= edge) {

            this.x = edge;
            this.direction = 1;
        }

        this.updatePosition();
    }


    // The hit tolerance shrinks naturally with the target's actual size.
    canBeHit(shooterX) {

        const distanceFromGun = Math.abs(this.x - shooterX);
        const hitArea = this.size / 2 + 6;

        return this.hiddenTime === 0 && distanceFromGun <= hitArea;
    }


    // Hide a hit target briefly before it returns to its lane.
    hit() {

        this.hiddenTime = 0.45;

        this.element.classList.add("is-hit-hidden");
    }


    // Remove old targets when a level or round changes.
    destroy() {

        this.positionElement.remove();
    }
}
