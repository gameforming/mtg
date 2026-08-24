const gameState = {

    mode: null,

    turn: 0,

    activePlayer: 0,

    players: [

        {
            id: 0,

            name: "You",

            life: 20,

            library: [],

            hand: [],

            battlefield: [],

            graveyard: [],

            exile: [],

            mana: {}
        },

        {
            id: 1,

            name: "AI",

            life: 20,

            library: [],

            hand: [],

            battlefield: [],

            graveyard: [],

            exile: [],

            mana: {}
        }

    ],

    stack: [],

    phase: "beginning",

    step: "untap"

};
