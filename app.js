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

        const response =
            const SCRYFALL_PROXY =
                    "https://mtg-scryfall-proxy.onrender.com";

            fetch(
                `${SCRYFALL_PROXY}/api/cards/search?q=` +
                 encodeURIComponent(search)
            )
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

function displaySearchResults(data) {

    const results =
        document.getElementById(
            "searchResults"
        );


    results.innerHTML = "";


    if (!data.data || data.data.length === 0) {

        results.innerHTML = `
            <p>No cards found.</p>
        `;

        return;

    }


    data.data.forEach(card => {

        const image =
            card.image_uris?.normal ||
            card.card_faces?.[0]?.image_uris?.normal;


        if (!image) {
            return;
        }


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
                <option value="${deck.id}">
                    ${escapeHTML(deck.name)}
                </option>
            `;

        });


        element.innerHTML = `

            <img
                src="${image}"
                alt="${escapeHTML(card.name)}"
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
// STARTUP
// ======================================================

renderCollection();

renderDecks();
