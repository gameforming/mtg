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


    container.innerHTML = "";


    Object.values(GAME_MODES)
        .forEach(mode => {

            const element =
                document.createElement("div");


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


            container.appendChild(element);

        });

}


// ======================================================
// SELECT GAME MODE
// ======================================================

function selectGameMode(modeId) {

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
// SELECTED MODE INFO
// ======================================================

function renderSelectedMode() {

    const container =
        document.getElementById(
            "selectedMode"
        );


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


    container.innerHTML = "";


    if (!selectedGameMode) {

        container.innerHTML = `
            <p>
                Choose a game mode first.
            </p>
        `;

        return;

    }


    if (decks.length === 0) {

        container.innerHTML = `
            <p>
                You don't have any decks.
            </p>

            <button onclick="showPage('decksPage')">
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
                document.createElement("div");


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
                                Select
                            </button>
                        `

                        :

                        `
                            <span class="invalid">
                                ✗
                                ${escapeHTML(
                                    validation.errors[0]
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

                            renderDeckSelection();

                            renderOpponentSelection();

                        }
                    );

            }


            container.appendChild(element);

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
        selectedGameMode.opponents.ai
    ) {

        const ai =
            document.createElement("div");


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

                    selectedOpponent = "ai";

                    renderOpponentSelection();

                    renderStartButton();

                }
            );


        container.appendChild(ai);

    }


    // ==================================================
    // MULTIPLAYER
    // ==================================================

    const multiplayer =
        document.createElement("div");


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


    if (
        selectedGameMode &&
        selectedDeckId &&
        selectedOpponent
    ) {

        container.innerHTML = `

            <button
                class="startGameButton"
                onclick="startGame()"
            >
                PLAY
            </button>

        `;

    } else {

        container.innerHTML = "";

    }

}


// ======================================================
// START GAME
// ======================================================

function startGame() {

    if (!selectedGameMode) {

        alert(
            "Select a game mode."
        );

        return;

    }


    if (!selectedDeckId) {

        alert(
            "Select a deck."
        );

        return;

    }


    if (!selectedOpponent) {

        alert(
            "Select an opponent."
        );

        return;

    }


    const deck =
        decks.find(
            deck => deck.id === selectedDeckId
        );


    if (!deck) {

        alert(
            "Deck not found."
        );

        return;

    }


    const validation =
        validateDeck(
            deck,
            selectedGameMode
        );


    if (!validation.valid) {

        alert(
            "This deck is no longer valid."
        );

        return;

    }


    // ----------------------------------------------
    // FOR NOW
    // ----------------------------------------------

    alert(

        `Starting ${selectedGameMode.name} ` +
        `with ${deck.name} ` +
        `against ${selectedOpponent}.`

    );


    // Later:
    //
    // startGameEngine({
    //     mode: selectedGameMode,
    //     deck: deck,
    //     opponent: selectedOpponent
    // });

}
