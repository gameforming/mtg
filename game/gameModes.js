// ======================================================
// MTG GAME MODES
// ======================================================
//
// Hier staan ALLE requirements van de gamemodes.
// De rest van de game gebruikt deze gegevens.
//
// Voeg later eenvoudig nieuwe gamemodes toe.
// ======================================================


const GAME_MODES = {

    standard: {

        id: "standard",

        name: "Standard",

        description:
            "Play a traditional 60-card Magic game.",

        players: {
            minimum: 2,
            maximum: 2
        },

        deck: {

            minimumCards: 60,

            maximumCards: null,

            sideboardSize: 15,

            maxCopies: 4,

            commander: false

        },

        rules: {

            startingLife: 20,

            startingHand: 7,

            mulligan: true

        },

        opponents: {

            ai: true,

            multiplayer: true

        }

    },


    commander: {

        id: "commander",

        name: "Commander",

        description:
            "Build a 100-card singleton deck around a commander.",

        players: {

            minimum: 2,

            maximum: 4

        },

        deck: {

            minimumCards: 100,

            maximumCards: 100,

            sideboardSize: 0,

            maxCopies: 1,

            commander: true

        },

        rules: {

            startingLife: 40,

            startingHand: 7,

            mulligan: true

        },

        opponents: {

            ai: true,

            multiplayer: true

        }

    },


    modern: {

        id: "modern",

        name: "Modern",

        description:
            "Play a 60-card Modern deck.",

        players: {

            minimum: 2,

            maximum: 2

        },

        deck: {

            minimumCards: 60,

            maximumCards: null,

            sideboardSize: 15,

            maxCopies: 4,

            commander: false

        },

        rules: {

            startingLife: 20,

            startingHand: 7,

            mulligan: true

        },

        opponents: {

            ai: true,

            multiplayer: true

        }

    },


    pioneer: {

        id: "pioneer",

        name: "Pioneer",

        description:
            "Play a 60-card Pioneer deck.",

        players: {

            minimum: 2,

            maximum: 2

        },

        deck: {

            minimumCards: 60,

            maximumCards: null,

            sideboardSize: 15,

            maxCopies: 4,

            commander: false

        },

        rules: {

            startingLife: 20,

            startingHand: 7,

            mulligan: true

        },

        opponents: {

            ai: true,

            multiplayer: true

        }

    },


    legacy: {

        id: "legacy",

        name: "Legacy",

        description:
            "Play a 60-card Legacy deck.",

        players: {

            minimum: 2,

            maximum: 2

        },

        deck: {

            minimumCards: 60,

            maximumCards: null,

            sideboardSize: 15,

            maxCopies: 4,

            commander: false

        },

        rules: {

            startingLife: 20,

            startingHand: 7,

            mulligan: true

        },

        opponents: {

            ai: true,

            multiplayer: true

        }

    },


    test: {

        id: "test",

        name: "Playtest",

        description:
            "A free mode for testing decks without format restrictions.",

        players: {

            minimum: 2,

            maximum: 2

        },

        deck: {

            minimumCards: 1,

            maximumCards: null,

            sideboardSize: 0,

            maxCopies: null,

            commander: false

        },

        rules: {

            startingLife: 20,

            startingHand: 7,

            mulligan: true

        },

        opponents: {

            ai: true,

            multiplayer: false

        }

    }

};


// ======================================================
// GET ALL MODES
// ======================================================

function getGameModes() {

    return Object.values(GAME_MODES);

}


// ======================================================
// GET MODE
// ======================================================

function getGameMode(modeId) {

    return GAME_MODES[modeId] || null;

}
