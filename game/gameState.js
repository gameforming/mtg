// ======================================================
// GAME STATE
// ======================================================
//
// Dit bestand bevat alleen de data van een wedstrijd.
// Geen UI en geen AI-logica.
//
// Hierdoor kunnen we later dezelfde GameState gebruiken
// voor:
// - AI
// - Multiplayer
// - Replays
// - Save states
// ======================================================


function createPlayer(id, name, deck, startingLife) {

    return {

        id: id,

        name: name,

        life: startingLife,

        // Deck
        library: deck,

        // Zones
        hand: [],

        battlefield: [],

        graveyard: [],

        exile: [],

        commandZone: [],

        // Mana komt later
        mana: {
            available: 0,
            maximum: 0
        },

        // Extra informatie
        hasLost: false,

        hasWon: false

    };

}


function createGameState(
    mode,
    playerDeck,
    opponentDeck
) {

    return {

        // ==================================================
        // GAME INFORMATION
        // ==================================================

        id: crypto.randomUUID(),

        mode: mode.id,

        modeData: mode,

        status: "starting",


        // ==================================================
        // TURN
        // ==================================================

        turn: 0,

        activePlayer: 0,

        priorityPlayer: 0,


        // ==================================================
        // PHASE
        // ==================================================

        phase: "beginning",

        step: "untap",


        // ==================================================
        // PLAYERS
        // ==================================================

        players: [

            createPlayer(
                0,
                "You",
                playerDeck,
                mode.rules.startingLife
            ),

            createPlayer(
                1,
                "AI",
                opponentDeck,
                mode.rules.startingLife
            )

        ],


        // ==================================================
        // STACK
        // ==================================================

        stack: [],


        // ==================================================
        // GAME LOG
        // ==================================================

        log: [],


        // ==================================================
        // WINNER
        // ==================================================

        winner: null,


        // ==================================================
        // MULLIGAN
        // ==================================================

        mulligan: {

            active: true,

            playersReady: [],

            playerChoices: []

        }

    };

}
