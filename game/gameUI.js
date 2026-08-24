// ======================================================
// GAME UI
// ======================================================


function openGamePage() {

    window.location.href =
        "game/game.html";

}


// ======================================================
// RENDER GAME
// ======================================================

function renderGame() {

    if (!currentGame) {
        return;
    }


    renderPlayers();

    renderHands();

    renderBattlefields();

    renderGameInfo();

    renderGameLog();

}


// ======================================================
// PLAYERS
// ======================================================

function renderPlayers() {

    const player =
        currentGame.players[0];

    const opponent =
        currentGame.players[1];


    document
        .getElementById(
            "playerName"
        )
        .textContent =
        player.name;


    document
        .getElementById(
            "playerLife"
        )
        .textContent =
        player.life;


    document
        .getElementById(
            "opponentName"
        )
        .textContent =
        opponent.name;


    document
        .getElementById(
            "opponentLife"
        )
        .textContent =
        opponent.life;

}


// ======================================================
// HANDS
// ======================================================

function renderHands() {

    const player =
        currentGame.players[0];

    const opponent =
        currentGame.players[1];


    const playerHand =
        document.getElementById(
            "playerHand"
        );


    const opponentHand =
        document.getElementById(
            "opponentHand"
        );


    // ----------------------------------------------
    // PLAYER HAND
    // ----------------------------------------------

    playerHand.innerHTML = "";


    player.hand.forEach(card => {

        const element =
            document.createElement("div");


        element.className =
            "gameCard";


        element.innerHTML = `

            <img
                src="${card.image}"
                alt="${escapeHTML(card.name)}"
            >

        `;


        playerHand.appendChild(
            element
        );

    });


    // ----------------------------------------------
    // OPPONENT HAND
    // ----------------------------------------------

    opponentHand.innerHTML = "";


    opponent.hand.forEach(() => {

        const element =
            document.createElement("div");


        element.className =
            "cardBack";


        element.textContent =
            "MTG";


        opponentHand.appendChild(
            element
        );

    });

}


// ======================================================
// BATTLEFIELDS
// ======================================================

function renderBattlefields() {

    const player =
        currentGame.players[0];

    const opponent =
        currentGame.players[1];


    renderBattlefield(
        "playerBattlefield",
        player.battlefield
    );


    renderBattlefield(
        "opponentBattlefield",
        opponent.battlefield
    );

}


function renderBattlefield(
    elementId,
    cards
) {

    const container =
        document.getElementById(
            elementId
        );


    container.innerHTML = "";


    cards.forEach(card => {

        const element =
            document.createElement("div");


        element.className =
            "gameCard";


        element.innerHTML = `

            <img
                src="${card.image}"
                alt="${escapeHTML(card.name)}"
            >

        `;


        container.appendChild(
            element
        );

    });

}


// ======================================================
// GAME INFO
// ======================================================

function renderGameInfo() {

    document
        .getElementById(
            "turnNumber"
        )
        .textContent =
        currentGame.turn;


    document
        .getElementById(
            "currentPhase"
        )
        .textContent =
        formatPhase(
            currentGame.phase
        );


    const activePlayer =
        currentGame.players[
            currentGame.activePlayer
        ];


    document
        .getElementById(
            "gameMessage"
        )
        .textContent =
        `${activePlayer.name}'s turn`;

}


// ======================================================
// LOG
// ======================================================

function renderGameLog() {

    const container =
        document.getElementById(
            "gameLog"
        );


    container.innerHTML = "";


    currentGame.log
        .slice(-20)
        .forEach(entry => {

            const element =
                document.createElement("p");


            element.textContent =
                `Turn ${entry.turn}: ${entry.message}`;


            container.appendChild(
                element
            );

        });


    container.scrollTop =
        container.scrollHeight;

}


// ======================================================
// PHASE FORMAT
// ======================================================

function formatPhase(phase) {

    const names = {

        beginning:
            "Beginning",

        main1:
            "Main Phase",

        combat:
            "Combat",

        main2:
            "Second Main Phase",

        ending:
            "Ending"

    };


    return names[phase] || phase;

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value;


    return div.innerHTML;

}
