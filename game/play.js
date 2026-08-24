// ======================================================
// PLAY SYSTEM
// ======================================================


// ======================================================
// DATA
// ======================================================

let selectedGameMode = null;

let selectedDeckId = null;

let selectedOpponent = null;


// ======================================================
// OPEN PLAY
// ======================================================

function openPlay() {

    showPage("playPage");


    selectedGameMode = null;

    selectedDeckId = null;

    selectedOpponent = null;


    renderGameModes();

    renderSelectedMode();

    renderDeckSelection();

    renderOpponentSelection();

}


// ======================================================
// GAME MODES
// ======================================================

function renderGameModes() {

    const container =
        document.getElementById(
            "gameModes"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    Object.values(GAME_MODES)
        .forEach(mode => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "gameMode";


            element.innerHTML = `

                <h3>
                    ${escapeHTML(mode.name)}
                </h3>

                <p>
                    ${escapeHTML(mode.description)}
                </p>

                <button>
                    Select
                </button>

            `;


            element
                .querySelector("button")
                .addEventListener(
                    "click",
                    () => {

                        selectGameMode(
                            mode.id
                        );

                    }
                );


            container.appendChild(
                element
            );

        });

}


// ======================================================
// SELECT GAME MODE
// ======================================================

function selectGameMode(
    modeId
) {

    selectedGameMode =
        getGameMode(modeId);


    selectedDeckId = null;

    selectedOpponent = null;


    renderGameModes();

    renderSelectedMode();

    renderDeckSelection();

    renderOpponentSelection();

}


// ======================================================
// SELECTED MODE
// ======================================================

function renderSelectedMode() {

    const container =
        document.getElementById(
            "selectedMode"
        );


    if (!container) {
        return;
    }


    if (!selectedGameMode) {

        container.innerHTML = `

            <p>
                Select a game mode.
            </p>

        `;

        return;

    }


    const mode =
        selectedGameMode;


    const maximumCards =
        mode.deck.maximumCards === null
            ? "No limit"
            : mode.deck.maximumCards;


    const copyLimit =
        mode.deck.maxCopies === null
            ? "No limit"
            : mode.deck.maxCopies;


    container.innerHTML = `

        <h2>
            ${escapeHTML(mode.name)}
        </h2>

        <p>
            ${escapeHTML(mode.description)}
        </p>

        <div class="requirements">

            <p>
                <strong>Minimum cards:</strong>
                ${mode.deck.minimumCards}
            </p>

            <p>
                <strong>Maximum cards:</strong>
                ${maximumCards}
            </p>

            <p>
                <strong>Maximum copies:</strong>
                ${copyLimit}
            </p>

            <p>
                <strong>Starting life:</strong>
                ${mode.rules.startingLife}
            </p>

            <p>
                <strong>Starting hand:</strong>
                ${mode.rules.startingHand}
            </p>

            <p>
                <strong>Players:</strong>
                ${mode.players.minimum}
                -
                ${mode.players.maximum}
            </p>

        </div>

    `;

}


// ======================================================
// DECK SELECTION
// ======================================================

function renderDeckSelection() {

    const container =
        document.getElementById(
            "deckSelection"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!selectedGameMode) {

        container.innerHTML = `

            <p>
                Choose a game mode first.
            </p>

        `;

        return;

    }


    if (
        typeof decks === "undefined" ||
        decks.length === 0
    ) {

        container.innerHTML = `

            <p>
                You don't have any decks.
            </p>

            <button
                onclick="showPage('decksPage')"
            >
                Create a Deck
            </button>

        `;

        return;

    }


    const suitableDecks =
        decks.map(deck => {

            return {

                deck,

                validation:
                    validateDeck(
                        deck,
                        selectedGameMode
                    )

            };

        });


    suitableDecks.forEach(
        ({ deck, validation }) => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                validation.valid
                    ? "playDeck suitable"
                    : "playDeck unsuitable";


            element.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(deck.name)}
                    </h3>

                    <p>
                        ${validation.totalCards}
                        cards
                    </p>

                </div>

                <div>

                    ${
                        validation.valid

                        ?

                        `
                            <span class="valid">
                                ✓ Suitable
                            </span>

                            <button>
                                ${
                                    selectedDeckId === deck.id
                                        ? "Selected"
                                        : "Select"
                                }
                            </button>
                        `

                        :

                        `
                            <span class="invalid">
                                ✗
                                ${escapeHTML(
                                    validation.errors[0] ||
                                    "Not suitable"
                                )}
                            </span>
                        `

                    }

                </div>

            `;


            if (validation.valid) {

                element
                    .querySelector("button")
                    .addEventListener(
                        "click",
                        () => {

                            selectedDeckId =
                                deck.id;


                            selectedOpponent =
                                null;


                            renderDeckSelection();

                            renderOpponentSelection();

                        }
                    );

            }


            container.appendChild(
                element
            );

        }
    );

}


// ======================================================
// OPPONENT SELECTION
// ======================================================

function renderOpponentSelection() {

    const container =
        document.getElementById(
            "opponentSelection"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !selectedGameMode ||
        !selectedDeckId
    ) {

        container.innerHTML = `

            <p>
                Select a suitable deck first.
            </p>

        `;

        return;

    }


    // ==================================================
    // AI
    // ==================================================

    if (
        selectedGameMode.opponents &&
        selectedGameMode.opponents.ai
    ) {

        const ai =
            document.createElement(
                "div"
            );


        ai.className =
            selectedOpponent === "ai"
                ? "opponent selected"
                : "opponent";


        ai.innerHTML = `

            <h3>
                🤖 AI
            </h3>

            <p>
                Play against an AI opponent.
            </p>

            <button>
                ${
                    selectedOpponent === "ai"
                        ? "Selected"
                        : "Select"
                }
            </button>

        `;


        ai
            .querySelector("button")
            .addEventListener(
                "click",
                () => {

                    selectedOpponent =
                        "ai";


                    renderOpponentSelection();

                }
            );


        container.appendChild(
            ai
        );

    }


    // ==================================================
    // MULTIPLAYER
    // ==================================================

    const multiplayer =
        document.createElement(
            "div"
        );


    multiplayer.className =
        "opponent disabled";


    multiplayer.innerHTML = `

        <h3>
            🌐 Multiplayer
        </h3>

        <p>
            Play against another player.
        </p>

        <span>
            Coming Soon
        </span>

    `;


    container.appendChild(
        multiplayer
    );


    renderStartButton();

}


// ======================================================
// START BUTTON
// ======================================================

function renderStartButton() {

    const container =
        document.getElementById(
            "startGameContainer"
        );


    if (!container) {
        return;
    }


    if (
        selectedGameMode &&
        selectedDeckId &&
        selectedOpponent
    ) {

        container.innerHTML = `

            <button
                class="startGameButton"
                id="startGameButton"
            >
                PLAY
            </button>

        `;


        document
            .getElementById(
                "startGameButton"
            )
            .addEventListener(
                "click",
                startGame
            );


    } else {

        container.innerHTML = "";

    }

}


// ======================================================
// START GAME
// ======================================================

function startGame() {

    console.log(
        "Starting game..."
    );


    // ==================================================
    // CHECK MODE
    // ==================================================

    if (!selectedGameMode) {

        alert(
            "Select a game mode."
        );

        return;

    }


    // ==================================================
    // CHECK DECK
    // ==================================================

    if (!selectedDeckId) {

        alert(
            "Select a deck."
        );

        return;

    }


    // ==================================================
    // CHECK OPPONENT
    // ==================================================

    if (!selectedOpponent) {

        alert(
            "Select an opponent."
        );

        return;

    }


    // ==================================================
    // FIND DECK
    // ==================================================

    const deck =
        decks.find(
            deck =>
                deck.id ===
                selectedDeckId
        );


    if (!deck) {

        alert(
            "Deck not found."
        );

        return;

    }


    // ==================================================
    // VALIDATE
    // ==================================================

    const validation =
        validateDeck(
            deck,
            selectedGameMode
        );


    if (!validation.valid) {

        alert(
            validation.errors.join("\n")
        );

        return;

    }


    // ==================================================
    // AI DECK
    // ==================================================

    const opponentDeck =
        JSON.parse(
            JSON.stringify(deck)
        );


    // ==================================================
    // SAVE GAME CONFIG
    // ==================================================

    const gameConfig = {

        mode:
            selectedGameMode,

        playerDeck:
            deck,

        opponentDeck:
            opponentDeck,

        opponent:
            selectedOpponent

    };


    try {

        sessionStorage.setItem(
            "mtg_pending_game",
            JSON.stringify(
                gameConfig
            )
        );

    } catch (error) {

        console.error(
            "Could not save game config:",
            error
        );


        alert(
            "Could not prepare the game."
        );

        return;

    }


    // ==================================================
    // OPEN GAME
    // ==================================================

    window.location.href =
        "game/game.html";

}
