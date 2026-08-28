```javascript
// ======================================================
// MTG GAME - APP.JS
// ======================================================


// ======================================================
// CONFIG
// ======================================================

const MTG_PROXY =
    "https://mtg-scryfall-proxy.onrender.com";


// ======================================================
// DATA
// ======================================================

let collection =
    JSON.parse(
        localStorage.getItem("mtgCollection")
    ) || [];

let decks =
    JSON.parse(
        localStorage.getItem("mtgDecks")
    ) || [];


// ======================================================
// STORAGE
// ======================================================

function saveCollection() {

    localStorage.setItem(
        "mtgCollection",
        JSON.stringify(collection)
    );

}


function saveDecks() {

    localStorage.setItem(
        "mtgDecks",
        JSON.stringify(decks)
    );

}


// ======================================================
// PAGE SYSTEM
// ======================================================

function showPage(pageId) {

    const pages = [
        "searchPage",
        "collectionPage",
        "decksPage",
        "deckViewPage",
        "prebuiltPage",
        "playPage"
    ];


    pages.forEach(page => {

        const element =
            document.getElementById(page);

        if (element) {
            element.classList.add("hidden");
        }

    });


    const selectedPage =
        document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }


    // ------------------------------------------
    // PAGE-SPECIFIC RENDERING
    // ------------------------------------------

    if (pageId === "collectionPage") {
        renderCollection();
    }


    if (pageId === "decksPage") {
        renderDecks();
    }


    if (pageId === "prebuiltPage") {
        renderPrebuiltDecks();
    }

}


// ======================================================
// PLAY
// ======================================================

function openPlay() {

    showPage("playPage");

}


// ======================================================
// SEARCH
// ======================================================

function handleSearchKey(event) {

    if (event.key === "Enter") {

        searchCards();

    }

}


async function searchCards() {

    const inputElement =
        document.getElementById(
            "searchInput"
        );


    if (!inputElement) {
        return;
    }


    const input =
        inputElement.value.trim();


    if (!input) {
        return;
    }


    const results =
        document.getElementById(
            "searchResults"
        );


    if (!results) {
        return;
    }


    results.innerHTML = `
        <p>Searching...</p>
    `;


    try {

        const response =
            await fetch(
                `${MTG_PROXY}/api/cards/search?q=` +
                encodeURIComponent(input)
            );


        if (!response.ok) {

            throw new Error(
                "Scryfall search failed: " +
                response.status
            );

        }


        const data =
            await response.json();


        displaySearchResults(data);

    }

    catch (error) {

        console.error(
            "Search error:",
            error
        );


        results.innerHTML = `
            <p>No cards found.</p>
        `;

    }

}


// ======================================================
// DISPLAY SEARCH RESULTS
// ======================================================

function displaySearchResults(data) {

    const results =
        document.getElementById(
            "searchResults"
        );


    if (!results) {
        return;
    }


    results.innerHTML = "";


    if (
        !data ||
        !Array.isArray(data.data) ||
        data.data.length === 0
    ) {

        results.innerHTML = `
            <p>No cards found.</p>
        `;

        return;

    }


    data.data.forEach(card => {

        const imageUrl =
            card.image_uris?.normal ||
            card.card_faces?.[0]?.image_uris?.normal;


        if (!imageUrl) {
            return;
        }


        const proxyImage =
            `${MTG_PROXY}/api/cards/image?url=` +
            encodeURIComponent(imageUrl);


        const element =
            document.createElement("div");


        element.className = "card";


        // ------------------------------------------
        // DECK OPTIONS
        // ------------------------------------------

        let deckOptions = `
            <option value="">
                Choose a deck...
            </option>
        `;


        decks.forEach(deck => {

            deckOptions += `
                <option value="${escapeHTML(deck.id)}">
                    ${escapeHTML(deck.name)}
                </option>
            `;

        });


        // ------------------------------------------
        // CARD HTML
        // ------------------------------------------

        element.innerHTML = `

            <img
                src="${proxyImage}"
                alt="${escapeHTML(card.name)}"
                loading="lazy"
            >

            <h3>
                ${escapeHTML(card.name)}
            </h3>

            <select class="deckSelect">
                ${deckOptions}
            </select>

            <button class="addDeckButton">
                Add to Deck
            </button>

            <button class="addCollectionButton">
                Add to Collection
            </button>

        `;


        // ------------------------------------------
        // ADD TO DECK
        // ------------------------------------------

        const deckButton =
            element.querySelector(
                ".addDeckButton"
            );


        deckButton.addEventListener(
            "click",
            () => {

                const select =
                    element.querySelector(
                        ".deckSelect"
                    );


                const deckId =
                    select.value;


                if (!deckId) {

                    alert(
                        "Choose a deck first."
                    );

                    return;

                }


                addCardToDeck(
                    card,
                    deckId
                );

            }
        );


        // ------------------------------------------
        // ADD TO COLLECTION
        // ------------------------------------------

        const collectionButton =
            element.querySelector(
                ".addCollectionButton"
            );


        collectionButton.addEventListener(
            "click",
            () => {

                addToCollection(card);

            }
        );


        results.appendChild(
            element
        );

    });

}


// ======================================================
// COLLECTION
// ======================================================

function addToCollection(card) {

    const existing =
        collection.find(
            item => item.id === card.id
        );


    if (existing) {

        existing.amount++;

    }

    else {

        collection.push({

            id: card.id,

            name: card.name,

            image:
                card.image_uris?.normal ||
                card.card_faces?.[0]?.image_uris?.normal,

            amount: 1

        });

    }


    saveCollection();


    alert(
        `${card.name} added to your collection.`
    );


    renderCollection();

}


function renderCollection() {

    const container =
        document.getElementById(
            "collection"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (collection.length === 0) {

        container.innerHTML = `
            <p>Your collection is empty.</p>
        `;

        return;

    }


    collection.forEach(card => {

        const element =
            document.createElement("div");


        element.className = "card";


        const image =
            card.image || "";


        const proxyImage =
            image
                ? `${MTG_PROXY}/api/cards/image?url=` +
                  encodeURIComponent(image)
                : "";


        element.innerHTML = `

            ${
                proxyImage
                    ? `
                        <img
                            src="${proxyImage}"
                            alt="${escapeHTML(card.name)}"
                            loading="lazy"
                        >
                    `
                    : ""
            }

            <h3>
                ${escapeHTML(card.name)}
            </h3>

            <p>
                Quantity: ${card.amount}
            </p>

            <button
                class="removeCollectionButton"
            >
                Remove One
            </button>

        `;


        element
            .querySelector(
                ".removeCollectionButton"
            )
            .addEventListener(
                "click",
                () => {

                    removeFromCollection(
                        card.id
                    );

                }
            );


        container.appendChild(
            element
        );

    });

}


function removeFromCollection(id) {

    const card =
        collection.find(
            item => item.id === id
        );


    if (!card) {
        return;
    }


    card.amount--;


    if (card.amount <= 0) {

        collection =
            collection.filter(
                item => item.id !== id
            );

    }


    saveCollection();


    renderCollection();

}


// ======================================================
// CREATE DECK
// ======================================================

function createDeck() {

    const name =
        prompt(
            "Enter a name for your deck:"
        );


    if (!name || !name.trim()) {
        return;
    }


    const deck = {

        id:
            crypto.randomUUID(),

        name:
            name.trim(),

        cards: []

    };


    decks.push(
        deck
    );


    saveDecks();


    renderDecks();

}


// ======================================================
// RENDER DECKS
// ======================================================

function renderDecks() {

    const container =
        document.getElementById(
            "decks"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (decks.length === 0) {

        container.innerHTML = `
            <p>
                You don't have any decks yet.
            </p>
        `;

        return;

    }


    decks.forEach(deck => {

        const element =
            document.createElement("div");


        element.className = "deck";


        const cardCount =
            Array.isArray(deck.cards)
                ? deck.cards.reduce(
                    (total, card) =>
                        total + (card.amount || 0),
                    0
                )
                : 0;


        element.innerHTML = `

            <h3>
                ${escapeHTML(deck.name)}
            </h3>

            <p>
                ${cardCount} cards
            </p>

            ${
                deck.source === "MTGJSON"
                    ? `
                        <p>
                            <small>
                                Prebuilt Deck
                            </small>
                        </p>
                    `
                    : ""
            }

            <div class="deckButtons">

                <button class="openButton">
                    Open
                </button>

                <button class="renameButton">
                    Rename
                </button>

                <button class="deleteButton">
                    Delete
                </button>

            </div>

        `;


        element
            .querySelector(
                ".openButton"
            )
            .addEventListener(
                "click",
                () => {

                    openDeck(
                        deck.id
                    );

                }
            );


        element
            .querySelector(
                ".renameButton"
            )
            .addEventListener(
                "click",
                () => {

                    renameDeck(
                        deck.id
                    );

                }
            );


        element
            .querySelector(
                ".deleteButton"
            )
            .addEventListener(
                "click",
                () => {

                    deleteDeck(
                        deck.id
                    );

                }
            );


        container.appendChild(
            element
        );

    });

}


// ======================================================
// ADD CARD TO DECK
// ======================================================

function addCardToDeck(
    card,
    deckId
) {

    const deck =
        decks.find(
            deck => deck.id === deckId
        );


    if (!deck) {

        console.error(
            "Deck not found:",
            deckId
        );

        return;

    }


    if (!Array.isArray(deck.cards)) {
        deck.cards = [];
    }


    const existing =
        deck.cards.find(
            item => item.id === card.id
        );


    if (existing) {

        existing.amount++;

    }

    else {

        deck.cards.push({

            id: card.id,

            name: card.name,

            image:
                card.image_uris?.normal ||
                card.card_faces?.[0]?.image_uris?.normal,

            amount: 1

        });

    }


    saveDecks();


    alert(
        `${card.name} added to ${deck.name}.`
    );


    renderDecks();

}


// ======================================================
// OPEN DECK
// ======================================================

function openDeck(deckId) {

    const deck =
        decks.find(
            deck => deck.id === deckId
        );


    if (!deck) {
        return;
    }


    const title =
        document.getElementById(
            "deckViewTitle"
        );


    const container =
        document.getElementById(
            "deckViewCards"
        );


    if (!title || !container) {
        return;
    }


    title.textContent =
        deck.name;


    container.innerHTML = "";


    if (
        !Array.isArray(deck.cards) ||
        deck.cards.length === 0
    ) {

        container.innerHTML = `
            <p>This deck is empty.</p>
        `;

        showPage(
            "deckViewPage"
        );

        return;

    }


    deck.cards.forEach(card => {

        const element =
            document.createElement("div");


        element.className = "card";


        const image =
            card.image || "";


        const proxyImage =
            image
                ? `${MTG_PROXY}/api/cards/image?url=` +
                  encodeURIComponent(image)
                : "";


        element.innerHTML = `

            ${
                proxyImage
                    ? `
                        <img
                            src="${proxyImage}"
                            alt="${escapeHTML(card.name)}"
                            loading="lazy"
                        >
                    `
                    : ""
            }

            <h3>
                ${escapeHTML(card.name)}
            </h3>

            <p>
                Quantity: ${card.amount}
            </p>

            <button
                class="removeDeckCardButton"
            >
                Remove One
            </button>

        `;


        element
            .querySelector(
                ".removeDeckCardButton"
            )
            .addEventListener(
                "click",
                () => {

                    removeCardFromDeck(
                        deck.id,
                        card.id
                    );

                }
            );


        container.appendChild(
            element
        );

    });


    showPage(
        "deckViewPage"
    );

}


// ======================================================
// REMOVE CARD FROM DECK
// ======================================================

function removeCardFromDeck(
    deckId,
    cardId
) {

    const deck =
        decks.find(
            deck => deck.id === deckId
        );


    if (!deck) {
        return;
    }


    const card =
        deck.cards.find(
            item => item.id === cardId
        );


    if (!card) {
        return;
    }


    card.amount--;


    if (card.amount <= 0) {

        deck.cards =
            deck.cards.filter(
                item => item.id !== cardId
            );

    }


    saveDecks();


    openDeck(
        deckId
    );

}


// ======================================================
// RENAME DECK
// ======================================================

function renameDeck(deckId) {

    const deck =
        decks.find(
            deck => deck.id === deckId
        );


    if (!deck) {
        return;
    }


    const newName =
        prompt(
            "New deck name:",
            deck.name
        );


    if (
        !newName ||
        !newName.trim()
    ) {

        return;

    }


    deck.name =
        newName.trim();


    saveDecks();


    renderDecks();

}


// ======================================================
// DELETE DECK
// ======================================================

function deleteDeck(deckId) {

    const deck =
        decks.find(
            deck => deck.id === deckId
        );


    if (!deck) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${deck.name}"?`
        );


    if (!confirmed) {
        return;
    }


    decks =
        decks.filter(
            deck => deck.id !== deckId
        );


    saveDecks();


    renderDecks();


    renderPrebuiltDecks();

}


// ======================================================
// PREBUILT DECK METADATA
// ======================================================
//
// BELANGRIJK:
//
// Hier staan alleen de gegevens om de decks
// op de Prebuilt-pagina te tonen.
//
// De kaarten zelf worden NIET hier geladen.
//
// Pas wanneer de gebruiker op
// "Add to My Decks" klikt wordt de decklist
// van de server opgehaald.
//
// ======================================================

const prebuiltDecks = [

    {
        id: "easy-starter",

        name: "Easy Starter Deck",

        description:
            "Een eenvoudig deck voor spelers die Magic willen leren.",

        difficulty: "Easy",

        color: "White",

        mtgjsonName:
            "Boros Convoke",

        type:
            "preconstructed"
    },


    {
        id: "complex-commander",

        name: "Complex Commander Deck",

        description:
            "Een moeilijk Commander deck met veel interactie en lastige keuzes.",

        difficulty: "Hard",

        color: "Esper",

        mtgjsonName:
            "Endless Punishment",

        type:
            "preconstructed"
    }

];


// ======================================================
// RENDER PREBUILT DECKS
// ======================================================

function renderPrebuiltDecks() {

    const container =
        document.getElementById(
            "prebuiltDecks"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    prebuiltDecks.forEach(
        prebuilt => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "deck";


            const alreadyAdded =
                decks.some(
                    deck =>
                        deck.prebuiltId ===
                        prebuilt.id
                );


            element.innerHTML = `

                <h3>
                    ${escapeHTML(prebuilt.name)}
                </h3>

                <p>
                    ${escapeHTML(prebuilt.description)}
                </p>

                <p>
                    <strong>
                        Difficulty:
                    </strong>

                    ${escapeHTML(prebuilt.difficulty)}
                </p>

                <p>
                    <strong>
                        Color:
                    </strong>

                    ${escapeHTML(prebuilt.color)}
                </p>

                <button
                    class="addPrebuiltButton"
                    ${alreadyAdded ? "disabled" : ""}
                >
                    ${
                        alreadyAdded
                            ? "Already Added"
                            : "Add to My Decks"
                    }
                </button>

            `;


            const button =
                element.querySelector(
                    ".addPrebuiltButton"
                );


            if (!alreadyAdded) {

                button.addEventListener(
                    "click",
                    () => {

                        addPrebuiltDeck(
                            prebuilt,
                            button
                        );

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
// ADD PREBUILT DECK
// ======================================================

async function addPrebuiltDeck(
    prebuilt,
    button
) {

    const alreadyExists =
        decks.some(
            deck =>
                deck.prebuiltId ===
                prebuilt.id
        );


    if (alreadyExists) {

        alert(
            "This prebuilt deck is already in your decks."
        );

        return;

    }


    if (button) {

        button.disabled = true;

        button.textContent =
            "Loading decklist...";

    }


    try {

        console.log(
            "Loading prebuilt deck:",
            prebuilt.name
        );


        const response =
            await fetch(
                `${MTG_PROXY}/api/prebuilt-decks/` +
                encodeURIComponent(
                    prebuilt.mtgjsonName
                )
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.cards ||
            !Array.isArray(data.cards)
        ) {

            throw new Error(
                "Invalid deck data."
            );

        }


        const deck = {

            id:
                crypto.randomUUID(),

            name:
                prebuilt.name,

            prebuiltId:
                prebuilt.id,

            difficulty:
                prebuilt.difficulty,

            source:
                "MTGJSON",

            cards:
                data.cards

        };


        decks.push(
            deck
        );


        saveDecks();


        renderDecks();


        renderPrebuiltDecks();


        alert(
            `${prebuilt.name} was added to your decks.`
        );

    }

    catch (error) {

        console.error(
            "Prebuilt deck error:",
            error
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Add to My Decks";

        }


        alert(
            "Could not load this prebuilt deck."
        );

    }

}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value ?? "");


    return div.innerHTML;

}


// ======================================================
// STARTUP
// ======================================================

renderCollection();

renderDecks();

renderPrebuiltDecks();


// ======================================================
// DEBUG
// ======================================================

console.log(
    "MTG app.js loaded successfully."
);
```
