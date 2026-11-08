// ========================================
// LEVEL MANAGER: LEVEL RULES AND ARENA THEMES
// ========================================

export class LevelManager {

    constructor() {

        this.level = 1;
        this.maximumLevel = 6;

        // Colours and sprite sizes are kept in css/styles.css.
        this.levelNames = [
            "Training Grounds",
            "Blue Horizon",
            "Golden Hour",
            "Violet Zone",
            "Red Alert",
            "Final Frontier"
        ];
    }


    // Start each round at the first level.
    reset() {

        this.level = 1;
    }


    // Five hits unlock each new level, up to the final sixth level.
    advance(score) {

        const levelsEarned = Math.floor(score / 5);
        const nextLevel = Math.min(this.maximumLevel, levelsEarned + 1);

        if (nextLevel <= this.level) {
            return false;
        }

        this.level = nextLevel;

        return true;
    }


    // Every level adds a target, increases speed and reduces target size.
    getConfiguration() {

        const levelName = this.levelNames[this.level - 1];

        return {
            number: this.level,
            name: levelName,
            targetCount: this.level,
            targetSize: 54 - (this.level - 1) * 4,
            targetSpeed: 100 + (this.level - 1) * 26
        };
    }

}
