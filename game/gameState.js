// ======================================================
// MTG GAME STATE
// ======================================================

function createPlayer(
    id,
    name,
    deck,
    startingLife = 20
) {

    return {

        id,

        name,

        life: startingLife,

        library: deck,

        hand: [],

        battlefield: [],

        graveyard: [],

        exile: [],

        commandZone: [],

        mana: {

            white: 0,
            blue: 0,
            black: 0,
            red: 0,
            green: 0,
            colorless: 0,

            available: 0,
            maximum: 0

        },

        landsPlayed: 0,

        handKept: false,

        mulligans: 0,

        hasLost: false,

        hasWon: false

    };

}


// ======================================================
// GAME STATE
// ======================================================

function createGameState(
    mode,
    playerDeck,
    opponentDeck
) {

    const startingLife =
        mode?.rules?.startingLife || 20;


    return {

        mode: mode,

        modeData: mode,

        status: "loading",

        turn: 0,

        activePlayer: 0,

        priorityPlayer: 0,

        firstTurn: true,

        phase: "beginning",

        step: "untap",

        winner: null,

        players: [

            createPlayer(
                0,
                "You",
                playerDeck,
                startingLife
            ),

            createPlayer(
                1,
                "AI",
                opponentDeck,
                startingLife
            )

        ],

        combat: {

            attackers: [],

            blockers: [],

            damageAssigned: false,

            resolved: false

        },

        stack: [],

        log: []

    };

}
