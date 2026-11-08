// ========================================
// COUNTDOWN: THREE SECONDS BEFORE A ROUND
// ========================================

export class Countdown {

    constructor() {

        this.timer = null;
        this.active = false;
    }


    // onTick shows a number. onComplete starts gameplay after the last number.
    start(onTick, onComplete) {

        this.cancel();

        this.active = true;

        let secondsLeft = 3;

        const showNextNumber = () => {

            if (!this.active) {
                return;
            }

            if (secondsLeft === 0) {

                this.active = false;
                this.timer = null;

                onComplete();

                return;
            }

            onTick(secondsLeft);

            secondsLeft--;

            this.timer = setTimeout(showNextNumber, 1000);

        };

        showNextNumber();
    }


    // Quit, pause and replay must not leave an old countdown running.
    cancel() {

        clearTimeout(this.timer);

        this.timer = null;
        this.active = false;
    }
}
