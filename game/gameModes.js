const GAME_MODES = {

    standard: {

        id: "standard",

        name: "Standard",

        description:
            "Play a normal Standard Magic game.",

        deck: {

            minimumCards: 60,

            maximumCards: null,

            sideboardSize: 15,

            maxCopies: 4,

            commander: false

        },

        players: {

            minimum: 2,

            maximum: 2

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
            "Play a four-player Commander game.",

        deck: {

            minimumCards: 100,

            maximumCards: 100,

            sideboardSize: 0,

            maxCopies: 1,

            commander: true

        },

        players: {

            minimum: 2,

            maximum: 4

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

    }

};
