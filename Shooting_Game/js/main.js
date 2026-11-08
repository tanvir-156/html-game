// ========================================
// GAME ENTRY POINT: CREATE THE MAIN OBJECTS
// ========================================

import { Game } from "./classes/Game.js?rev=larger-buttons-20261101-10";
import { Menu } from "./classes/Menu.js?rev=larger-buttons-20261101-10";
import { SoundManager } from "./classes/SoundManager.js?rev=larger-buttons-20261101-10";


// Each class has a separate responsibility and its own ES module file.
const soundManager = new SoundManager(
    document.getElementById("audioStatus")
);

const game = new Game(soundManager);

const menu = new Menu(game);

// The objects remain private to this module, not global window variables.
// The menu holds the game reference and event listeners keep it active.
