// ======================================================
// MTG GAME UI
// ======================================================
//
// Dit bestand zorgt alleen voor de interface.
//
// Game logic:
//     gameEngine.js
//
// Game data:
//     gameState.js
//
// UI:
//     gameUI.js
// ======================================================

const SCRYFALL_PROXY =
    "https://mtg-scryfall-proxy.onrender.com";
// ======================================================
// OPEN GAME PAGE
// ======================================================
function getCardImage(card) {

    if (!card || !card.image) {
        return "";
    }


    // Als de afbeelding al via onze proxy gaat,
    // gebruiken we hem direct.
    if (
        card.image.startsWith(
            SCRYFALL_PROXY
        )
    ) {

        return card.image;

    }


    // Als het een Scryfall afbeelding is,
    // sturen we hem via Render.
    return (
        `${SCRYFALL_PROXY}/api/cards/image?url=` +
        encodeURIComponent(
            card.image
        )
    );

}
function openGamePage() {

    window.location.href =
        "game.html";

}


// ======================================================
// RENDER EVERYTHING
// ======================================================

function renderGame() {

    if (!currentGame) {
        return;
    }


    renderPlayers();

    renderHands();

    renderBattlefields();

    renderGameInfo();

    renderGameControls();

    renderGameLog();

    renderMana();

}

// ======================================================
// PLAYERS
// ======================================================

function renderPlayers() {

    const player =
        currentGame.players[0];


    const opponent =
        currentGame.players[1];


    const playerName =
        document.getElementById(
            "playerName"
        );


    const playerLife =
        document.getElementById(
            "playerLife"
        );


    const opponentName =
        document.getElementById(
            "opponentName"
        );


    const opponentLife =
        document.getElementById(
            "opponentLife"
        );


    if (playerName) {

        playerName.textContent =
            player.name;

    }


    if (playerLife) {

        playerLife.textContent =
            player.life;

    }


    if (opponentName) {

        opponentName.textContent =
            opponent.name;

    }


    if (opponentLife) {

        opponentLife.textContent =
            opponent.life;

    }

}


// ======================================================
// RENDER HANDS
// ======================================================
function renderMana() {

    if (!currentGame) {
        return;
    }


    const mana =
        currentGame.players[0].mana;


    const elements = {

        white:
            document.getElementById(
                "whiteMana"
            ),

        blue:
            document.getElementById(
                "blueMana"
            ),

        black:
            document.getElementById(
                "blackMana"
            ),

        red:
            document.getElementById(
                "redMana"
            ),

        green:
            document.getElementById(
                "greenMana"
            ),

        colorless:
            document.getElementById(
                "colorlessMana"
            )

    };


    if (elements.white) {

        elements.white.textContent =
            mana.white;

    }


    if (elements.blue) {

        elements.blue.textContent =
            mana.blue;

    }


    if (elements.black) {

        elements.black.textContent =
            mana.black;

    }


    if (elements.red) {

        elements.red.textContent =
            mana.red;

    }


    if (elements.green) {

        elements.green.textContent =
            mana.green;

    }


    if (elements.colorless) {

        elements.colorless.textContent =
            mana.colorless;

    }

}
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


    // ==================================================
    // PLAYER HAND
    // ==================================================

    playerHand.innerHTML = "";


    player.hand.forEach(card => {

        const element =
            createCardElement(
                card,
                true
            );


        // ==============================================
        // LEFT CLICK
        // ==============================================

        element.addEventListener(
            "click",
            () => {

                handleCardClick(
                    card
                );

            }
        );


        // ==============================================
        // RIGHT CLICK
        // ==============================================

        element.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

            }
        );


        playerHand.appendChild(
            element
        );

    });


    // ==================================================
    // OPPONENT HAND
    // ==================================================

    opponentHand.innerHTML = "";


    opponent.hand.forEach(() => {

        const element =
            document.createElement(
                "div"
            );


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
// CREATE CARD ELEMENT
// ======================================================

function createCardElement(
    card,
    interactive = false
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "gameCard";


    element.dataset.instanceId =
        card.instanceId;


    // ==============================================
    // CARD IMAGE
    // ==============================================

if (card.image) {

    const image =
        document.createElement(
            "img"
        );


    // Gebruik Render proxy zodat
    // de browser Scryfall niet direct
    // hoeft te bereiken.
    image.src =
        getCardImage(card);


    image.alt =
        card.name;


    image.loading =
        "lazy";


    image.onerror =
        () => {

            console.error(
                "Card image failed:",
                card.name,
                image.src
            );

        };


    element.appendChild(
        image
    );

}
    } else {

        element.textContent =
            card.name;

    }


    // ==============================================
    // TAPPED
    // ==============================================

    if (card.tapped) {

        element.classList.add(
            "tapped"
        );

    }


    // ==============================================
    // ATTACKING
    // ==============================================

    if (card.attacking) {

        element.classList.add(
            "attacking"
        );

    }


    // ==============================================
    // SUMMONING SICKNESS
    // ==============================================

    if (
        card.summoningSickness
    ) {

        element.classList.add(
            "summoningSickness"
        );

    }


    return element;

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
        player.battlefield,
        true
    );


    renderBattlefield(
        "opponentBattlefield",
        opponent.battlefield,
        false
    );

}


// ======================================================
// RENDER BATTLEFIELD
// ======================================================

function renderBattlefield(
    elementId,
    cards,
    isPlayer
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    cards.forEach(card => {

        const element =
            createCardElement(
                card,
                true
            );


        // ==================================================
        // PLAYER CARD INTERACTIONS
        // ==================================================

        if (isPlayer) {


            // ==============================================
            // LEFT CLICK
            // ==============================================

            element.addEventListener(
                "click",
                () => {

                    handleBattlefieldClick(
                        card
                    );

                }
            );


            // ==============================================
            // DOUBLE CLICK
            // ==============================================

            element.addEventListener(
                "dblclick",
                () => {

                    if (
                        isCreature(card) &&
                        currentGame.phase === "combat" &&
                        currentGame.activePlayer === 0
                    ) {

                        toggleAttack(
                            card.instanceId
                        );

                    }

                }
            );


            // ==============================================
            // RIGHT CLICK
            // ==============================================

            element.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();


                    // Right click can later open
                    // the card interaction menu.

                    console.log(
                        "Card:",
                        card.name
                    );

                }
            );

        }


        container.appendChild(
            element
        );

    });

}


// ======================================================
// HAND CARD CLICK
// ======================================================

function handleCardClick(
    card
) {

    if (
        !currentGame
    ) {
        return;
    }


    if (
        currentGame.status !==
        "playing"
    ) {

        return;

    }


    // ==============================================
    // LAND
    // ==============================================

    if (
        isLand(card)
    ) {

        playLand(
            0,
            card.instanceId
        );


        return;

    }


    // ==============================================
    // SPELL / CREATURE
    // ==============================================

    if (
        currentGame.phase === "main1" ||
        currentGame.phase === "main2"
    ) {

        castCard(
            0,
            card.instanceId
        );

    }

}


// ======================================================
// BATTLEFIELD CLICK
// ======================================================

function handleBattlefieldClick(
    card
) {

    if (
        !currentGame
    ) {
        return;
    }


    // ==============================================
    // LAND
    // ==============================================

    if (
        isLand(card)
    ) {

        tapLand(
            0,
            card.instanceId
        );


        return;

    }


    // ==============================================
    // COMBAT
    // ==============================================

    if (
        currentGame.phase === "combat" &&
        isCreature(card)
    ) {

        toggleAttack(
            card.instanceId
        );

    }

}


// ======================================================
// GAME INFORMATION
// ======================================================

function renderGameInfo() {

    const turn =
        document.getElementById(
            "turnNumber"
        );


    const turnCenter =
        document.getElementById(
            "turnNumberCenter"
        );


    const phase =
        document.getElementById(
            "currentPhase"
        );


    const phaseCenter =
        document.getElementById(
            "currentPhaseCenter"
        );


    const message =
        document.getElementById(
            "gameMessage"
        );


    const activePlayer =
        currentGame.players[
            currentGame.activePlayer
        ];


    const phaseText =
        formatPhase(
            currentGame.phase
        );


    if (turn) {

        turn.textContent =
            currentGame.turn;

    }


    if (turnCenter) {

        turnCenter.textContent =
            currentGame.turn;

    }


    if (phase) {

        phase.textContent =
            phaseText;

    }


    if (phaseCenter) {

        phaseCenter.textContent =
            phaseText;

    }


    if (message) {

        message.textContent =
            `${activePlayer.name}'s turn`;

    }

}


// ======================================================
// CONTROLS
// ======================================================

function renderGameControls() {

    const mulligan =
        document.getElementById(
            "mulliganControls"
        );


    const combat =
        document.getElementById(
            "combatControls"
        );


    const controls =
        document.getElementById(
            "gameControls"
        );


    // ==============================================
    // MULLIGAN
    // ==============================================

    if (
        currentGame.status ===
        "mulligan"
    ) {

        if (mulligan) {

            mulligan.style.display =
                "block";

        }


        if (combat) {

            combat.style.display =
                "none";

        }


        if (controls) {

            controls.style.display =
                "none";

        }


        return;

    }


    if (mulligan) {

        mulligan.style.display =
            "none";

    }


    // ==============================================
    // FINISHED
    // ==============================================

    if (
        currentGame.status ===
        "finished"
    ) {

        if (combat) {

            combat.style.display =
                "none";

        }


        if (controls) {

            controls.style.display =
                "none";

        }


        renderWinner();

        return;

    }


    // ==============================================
    // NORMAL GAME
    // ==============================================

    if (controls) {

        controls.style.display =
            "block";

    }


    // ==============================================
    // COMBAT
    // ==============================================

    if (
        currentGame.phase ===
        "combat"
    ) {

        if (combat) {

            combat.style.display =
                "block";

        }

    } else {

        if (combat) {

            combat.style.display =
                "none";

        }

    }

}


// ======================================================
// WINNER
// ======================================================

function renderWinner() {

    const message =
        document.getElementById(
            "gameMessage"
        );


    if (!message) {
        return;
    }


    if (
        currentGame.winner === null
    ) {
        return;
    }


    const winner =
        currentGame.players[
            currentGame.winner
        ];


    message.textContent =
        `${winner.name} wins!`;

}


// ======================================================
// GAME LOG
// ======================================================

function renderGameLog() {

    const container =
        document.getElementById(
            "gameLog"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    currentGame.log
        .slice(-30)
        .forEach(entry => {

            const element =
                document.createElement(
                    "p"
                );


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
// FORMAT PHASE
// ======================================================

function formatPhase(
    phase
) {

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


    return (
        names[phase] ||
        phase
    );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}
