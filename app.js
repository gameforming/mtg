// ======================================================
// MTG GAME - APP.JS
// ======================================================


// ======================================================
// DATA
// ======================================================

let collection =
    JSON.parse(localStorage.getItem("mtgCollection")) || [];

let decks =
    JSON.parse(localStorage.getItem("mtgDecks")) || [];
// ======================================================
// DEFAULT PRECON DECKS
// ======================================================

function createDefaultPrecons() {

    // Alleen aanmaken als de gebruiker nog geen decks heeft.
    if (decks.length > 0) {
        return;
    }


    // ==================================================
    // EASY PRECON
    // ==================================================

    const easyPrecon = {

        id: crypto.randomUUID(),

        name: "Easy - White Creatures",

        difficulty: "Easy",

        cards: [

            {
                id: "5f2a5a91-3f9d-4c2e-bc3d-7f8f6c6b8c8a",
                name: "Plains",
                image: "",
                amount: 20
            },

            {
                id: "00000000-0000-0000-0000-000000000001",
                name: "Elite Vanguard",
                image: "",
                amount: 4
            },

            {
                id: "00000000-0000-0000-0000-000000000002",
                name: "Savannah Lions",
                image: "",
                amount: 4
            },

            {
                id: "00000000-0000-0000-0000-000000000003",
                name: "Serra Angel",
                image: "",
                amount: 4
            },

            {
                id: "00000000-0000-0000-0000-000000000004",
                name: "Pacifism",
                image: "",
                amount: 4
            },

            {
                id: "00000000-0000-0000-0000-000000000005",
                name: "Raise the Alarm",
                image: "",
                amount: 4
            },

            {
                id: "00000000-0000-0000-0000-000000000006",
                name: "Giant Growth",
                image: "",
                amount: 4
            }

        ]

    };


    // ==================================================
    // DIFFICULT PRECON
    // ==================================================

    const difficultPrecon = {

        id: crypto.randomUUID(),

        name: "Difficult - Graveyard Commander",

        difficulty: "Difficult",

        cards: [

            {
                id: "5f2a5a91-3f9d-4c2e-bc3d-7f8f6c6b8c8a",
                name: "Swamp",
                image: "",
                amount: 18
            },

            {
                id: "00000000-0000-0000-0000-000000000010",
                name: "Command Tower",
                image: "",
                amount: 1
            },

            {
                id: "00000000-0000-0000-0000-000000000011",
                name: "Midnight Reaper",
                image: "",
                amount: 3
            },

            {
                id: "00000000-0000-0000-0000-000000000012",
                name: "Cemetery Reaper",
                image: "",
                amount: 3
            },

            {
                id: "00000000-0000-0000-0000-000000000013",
                name: "God-Eternal Oketra",
                image: "",
                amount: 2
            },

            {
                id: "00000000-0000-0000-0000-000000000014",
                name: "Liliana, Death's Majesty",
                image: "",
                amount: 2
            },

            {
                id: "00000000-0000-0000-0000-000000000015",
                name: "Prophet of the Scarab",
                image: "",
                amount: 3
            },

            {
                id: "00000000-0000-0000-0000-000000000016",
                name: "Cursecloth Wrappings",
                image: "",
                amount: 3
            },

            {
                id: "00000000-0000-0000-0000-000000000017",
                name: "Accursed Duneyard",
                image: "",
                amount: 4
            }

        ]

    };


    decks.push(
        easyPrecon
    );

    decks.push(
        difficultPrecon
    );


    saveDecks();

}


// ======================================================
// CREATE DEFAULT PRECONS
// ======================================================

createDefaultPrecons();

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
        "deckViewPage"
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


    if (pageId === "collectionPage") {
        renderCollection();
    }


    if (pageId === "decksPage") {
        renderDecks();
    }

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

    const input =
        document
            .getElementById("searchInput")
            .value
            .trim();


    if (!input) {
        return;
    }


    const results =
        document.getElementById(
            "searchResults"
        );


    results.innerHTML = `
        <p>Searching...</p>
    `;


    try {

        const SCRYFALL_PROXY =
            "https://mtg-scryfall-proxy.onrender.com";

        const response =
            await fetch(
                `${SCRYFALL_PROXY}/api/cards/search?q=` +
                encodeURIComponent(input)
            );
        if (!response.ok) {
            throw new Error(
                "Scryfall search failed"
            );
        }


        const data =
            await response.json();


        displaySearchResults(data);


    } catch (error) {

        console.error(error);


        results.innerHTML = `
            <p>No cards found.</p>
        `;

    }

}


// ======================================================
// DISPLAY SEARCH RESULTS
// ======================================================

// ======================================================
// DISPLAY SEARCH RESULTS
// ======================================================

function displaySearchResults(data) {

    const SCRYFALL_PROXY =
        "https://mtg-scryfall-proxy.onrender.com";

    const results =
        document.getElementById("searchResults");


    results.innerHTML = "";


    // ------------------------------------------
    // NO RESULTS
    // ------------------------------------------

    if (!data.data || data.data.length === 0) {

        results.innerHTML = `
            <p>No cards found.</p>
        `;

        return;
    }


    // ------------------------------------------
    // DISPLAY EVERY CARD
    // ------------------------------------------

    data.data.forEach(card => {

        // Get image from normal cards
        // or double-faced cards
        const imageUrl =
            card.image_uris?.normal ||
            card.card_faces?.[0]?.image_uris?.normal;


        // Skip cards without an image
        if (!imageUrl) {
            return;
        }


        // ------------------------------------------
        // PROXY IMAGE
        // ------------------------------------------

        const proxyImage =
            `${SCRYFALL_PROXY}/api/cards/image?url=${encodeURIComponent(imageUrl)}`;


        // ------------------------------------------
        // CARD ELEMENT
        // ------------------------------------------

        const element =
            document.createElement("div");


        element.className = "card";


        // ------------------------------------------
        // CREATE DECK DROPDOWN
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

                const deckId =
                    element
                        .querySelector(".deckSelect")
                        .value;


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


        // ------------------------------------------
        // ADD CARD TO RESULTS
        // ------------------------------------------

        results.appendChild(element);

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

    } else {

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


        element.innerHTML = `

            <img
                src="${card.image}"
                alt="${escapeHTML(card.name)}"
            >

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


        container.appendChild(element);

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
// DECK CREATION
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

        id: crypto.randomUUID(),

        name: name.trim(),

        cards: []

    };


    decks.push(deck);


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
            deck.cards.reduce(
                (total, card) =>
                    total + card.amount,
                0
            );


        element.innerHTML = `

            <h3>
                ${escapeHTML(deck.name)}
            </h3>

            <p>
                ${cardCount} cards
            </p>

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


        // OPEN

        element
            .querySelector(".openButton")
            .addEventListener(
                "click",
                () => {

                    openDeck(deck.id);

                }
            );


        // RENAME

        element
            .querySelector(".renameButton")
            .addEventListener(
                "click",
                () => {

                    renameDeck(deck.id);

                }
            );


        // DELETE

        element
            .querySelector(".deleteButton")
            .addEventListener(
                "click",
                () => {

                    deleteDeck(deck.id);

                }
            );


        container.appendChild(element);

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


    // IMPORTANT:
    // We DO NOT check the collection.
    //
    // A player can add ANY card from
    // the search results to ANY deck.


    const existing =
        deck.cards.find(
            item => item.id === card.id
        );


    if (existing) {

        existing.amount++;

    } else {

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


    document
        .getElementById(
            "deckViewTitle"
        )
        .textContent = deck.name;


    const container =
        document.getElementById(
            "deckViewCards"
        );


    container.innerHTML = "";


    if (deck.cards.length === 0) {

        container.innerHTML = `
            <p>This deck is empty.</p>
        `;

        showPage("deckViewPage");

        return;

    }


    deck.cards.forEach(card => {

        const element =
            document.createElement("div");


        element.className = "card";


        element.innerHTML = `

            <img
                src="${card.image}"
                alt="${escapeHTML(card.name)}"
            >

            <h3>
                ${escapeHTML(card.name)}
            </h3>

            <p>
                Quantity: ${card.amount}
            </p>

            <button class="removeDeckCardButton">
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


        container.appendChild(element);

    });


    showPage("deckViewPage");

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


    openDeck(deckId);

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


    if (!newName || !newName.trim()) {
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

}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent = value;


    return div.innerHTML;

}

// ======================================================
// PREBUILT DECKS
// ======================================================

const MTG_PROXY =
"https://mtg-scryfall-proxy.onrender.com";

// ------------------------------------------------------
// PREBUILT DECKS
// ------------------------------------------------------
//
// We laden alleen metadata.
// De daadwerkelijke kaarten worden pas geladen
// wanneer de speler op "Add to My Decks" klikt.
// ------------------------------------------------------

const prebuiltDecks = [

```
{
    id: "easy-starter",

    name: "Easy Starter Deck",

    description:
        "Een eenvoudig deck om Magic te leren. " +
        "Veel creatures en simpele aanvallen.",

    difficulty: "Easy",

    color: "White",

    // Wordt gebruikt als externe deck identifier.
    // Deze kan later vervangen worden door een
    // specifieke MTGJSON deck.
    mtgjsonName: "Boros Convoke",

    type: "preconstructed"
},


{
    id: "complex-commander",

    name: "Complex Commander Deck",

    description:
        "Een veel complexer Commander deck met " +
        "meer interactie, triggers en moeilijke keuzes.",

    difficulty: "Hard",

    color: "Esper",

    mtgjsonName: "Endless Punishment",

    type: "preconstructed"
}
```

];

// ------------------------------------------------------
// SHOW PREBUILT DECKS
// ------------------------------------------------------

function renderPrebuiltDecks() {

```
const container =
    document.getElementById(
        "prebuiltDecks"
    );


if (!container) {
    return;
}


container.innerHTML = "";


prebuiltDecks.forEach(deck => {

    const element =
        document.createElement("div");


    element.className = "deck";


    const alreadyAdded =
        decks.some(
            existing =>
                existing.prebuiltId === deck.id
        );


    element.innerHTML = `

        <h3>
            ${escapeHTML(deck.name)}
        </h3>

        <p>
            ${escapeHTML(deck.description)}
        </p>

        <p>
            <strong>
                Difficulty:
            </strong>

            ${escapeHTML(deck.difficulty)}
        </p>

        <p>
            <strong>
                Color:
            </strong>

            ${escapeHTML(deck.color)}
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
                    deck
                );

            }
        );

    }


    container.appendChild(
        element
    );

});
```

}

// ------------------------------------------------------
// ADD PREBUILT DECK
// ------------------------------------------------------

async function addPrebuiltDeck(
prebuilt
) {

```
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


const buttonText =
    "Loading decklist...";


console.log(
    buttonText,
    prebuilt.name
);


try {

    /*
     * We ask our own server for the deck.
     *
     * IMPORTANT:
     * We are NOT downloading all prebuilt decks.
     *
     * Only this selected deck is requested.
     */

    const response =
        await fetch(
            `${MTG_PROXY}/api/prebuilt-decks/${encodeURIComponent(
                prebuilt.mtgjsonName
            )}`
        );


    if (!response.ok) {

        throw new Error(
            "Could not load prebuilt deck."
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

        cards:
            data.cards,

        source:
            "MTGJSON"

    };


    decks.push(deck);


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


    alert(
        "Could not load this prebuilt deck."
    );

}
```

}

// ======================================================
// PREBUILT PAGE STARTUP
// ======================================================

renderPrebuiltDecks();

// ======================================================
// STARTUP
// ======================================================

renderCollection();

renderDecks();
