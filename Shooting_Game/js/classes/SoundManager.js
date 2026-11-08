// ========================================
// SOUND MANAGER: AUDIO OBJECTS AND MUTE
// ========================================

export class SoundManager {

    constructor(status) {

        this.status = status;
        this.muted = false;
        // A Set keeps track of each sound that is currently playing.
        this.activeSounds = new Set();

        // import.meta.url is this JavaScript file's address.
        // The sound paths are relative to this file, not to the HTML page.
        this.sounds = {
            shoot: new Audio(new URL("../../audio/shoot.wav", import.meta.url).href),
            hit: new Audio(new URL("../../audio/hit.wav", import.meta.url).href),
            gameOver: new Audio(new URL("../../audio/game-over.wav", import.meta.url).href)
        };

        for (const sound of Object.values(this.sounds)) {

            sound.preload = "auto";
            sound.volume = 0.35;
        }
    }


    // A cloned Audio object lets a hit overlap the shoot sound.
    play(name) {

        if (this.muted || !this.sounds[name]) {
            return;
        }

        const sound = this.sounds[name].cloneNode();

        sound.volume = 0.35;

        if (name === "shoot") {
            sound.volume = 0.22;
        }

        this.activeSounds.add(sound);

        sound.addEventListener("ended", () => {

            this.activeSounds.delete(sound);

        }, { once: true });

        // Audio failures are shown on the page and never stop gameplay.
        const result = sound.play();

        if (result) {

            result.catch(() => {

                this.activeSounds.delete(sound);

                this.status.textContent = "Sound could not play. Check your browser's audio permission.";

            });
        }
    }


    toggle() {

        this.muted = !this.muted;

        if (this.muted) {

            for (const sound of this.activeSounds) {
                sound.pause();
            }

            this.activeSounds.clear();
        }

        this.status.textContent = "";
    }

}
