// ======================================================
// MTG GAME - APP.JS
// ======================================================


// ======================================================
// CONFIG
// ======================================================

const MTG_PROXY = "https://mtg-scryfall-proxy.onrender.com";


// ======================================================
// DATA
// ======================================================

let collection = [];

let decks = [];


// ======================================================
// LOAD STORAGE
// ======================================================

try {

    collection =
        JSON.parse(
            localStorage.getItem("mtgCollection")
        ) || [];

} catch (error) {

    console.error("Could not load collection:", error);

    collection = [];

}


try {

    decks =
        JSON.parse(
            localStorage.getItem("mtgDecks")
        ) || [];

} catch (error) {

    console.error("Could not load decks:", error);

    decks = [];

}


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
        "prebuiltPage",
        "collectionPage",
        "decksPage",
        "deckViewPage",
        "playPage"
    ];


    pages.forEach(function(page) {

        const element =
            document.getElementById(page);

        if (element) {

            element.classList.add("hidden");

        }

    });


    const selectedPage =
        document.getElementById(pageId);


    if (!selectedPage) {

        console.error(
            "Page not found:",
            pageId
        );

        return;

    }


    selectedPage.classList.remove("hidden");


    // Page-specific rendering

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
// SEARCH ENTER KEY
// ======================================================

function handleSearchKey(event) {

    if (!event) {

        return;

    }


    if (event.key === "Enter") {

        searchCards();

    }

}


// ======================================================
// SEARCH CARDS
// ======================================================

async function searchCards() {

    const inputElement =
        document.getElementById(
            "searchInput"
        );


    const results =
        document.getElementById(
            "searchResults"
        );


    if (!inputElement || !results) {

        console.error(
            "Search elements not found."
        );

        return;

    }


    const query =
        inputElement.value.trim();


    if (!query) {

        results.innerHTML =
            "<p>Enter a search query.</p>";

        return;

    }


    results.innerHTML =
        "<p>Searching...</p>";


    try {

        const url =
            MTG_PROXY +
            "/api/cards/search?q=" +
            encodeURIComponent(query);


        console.log(
            "Searching:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Server returned " +
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


        results.innerHTML =
            "<p>Could not search cards.</p>";

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

        results.innerHTML =
            "<p>No cards found.</p>";

        return;

    }


    data.data.forEach(function(card) {

        const imageUrl =
            getCardImage(card);


        if (!imageUrl) {

            return;

        }


        const proxyImage =
            MTG_PROXY +
            "/api/cards/image?url=" +
            encodeURIComponent(imageUrl);


        const element =
            document.createElement("div");


        element.className =
            "card";


        // Deck dropdown

        let deckOptions =
            '<option value="">Choose a deck...</option>';


        decks.forEach(function(deck) {

            deckOptions +=
                '<option value="' +
                escapeHTML(deck.id) +
                '">' +
                escapeHTML(deck.name) +
                "</option>";

        });


        element.innerHTML =
            '<img src="' +
            proxyImage +
            '" alt="' +
            escapeHTML(card.name) +
            '" loading="lazy">' +

            "<h3>" +
            escapeHTML(card.name) +
            "</h3>" +

            '<select class="deckSelect">' +
            deckOptions +
            "</select>" +

            '<button class="addDeckButton">' +
            "Add to Deck" +
            "</button>" +

            '<button class="addCollectionButton">' +
            "Add to Collection" +
            "</button>";


        // Add to deck

        const deckButton =
            element.querySelector(
                ".addDeckButton"
            );


        deckButton.addEventListener(
            "click",
            function() {

                const select =
                    element.querySelector(
                        ".deckSelect"
                    );


                if (!select || !select.value) {

                    alert(
                        "Choose a deck first."
                    );

                    return;

                }


                addCardToDeck(
                    card,
                    select.value
                );

            }
        );


        // Add to collection

        const collectionButton =
            element.querySelector(
                ".addCollectionButton"
            );


        collectionButton.addEventListener(
            "click",
            function() {

                addToCollection(card);

            }
        );


        results.appendChild(
            element
        );

    });

}


// ======================================================
// GET CARD IMAGE
// ======================================================

function getCardImage(card) {

    if (!card) {

        return "";

    }


    if (
        card.image_uris &&
        card.image_uris.normal
    ) {

        return card.image_uris.normal;

    }


    if (
        card.card_faces &&
        card.card_faces.length > 0 &&
        card.card_faces[0].image_uris &&
        card.card_faces[0].image_uris.normal
    ) {

        return card.card_faces[0].image_uris.normal;

    }


    return "";

}


// ======================================================
// COLLECTION
// ======================================================

function addToCollection(card) {

    const existing =
        collection.find(function(item) {

            return item.id === card.id;

        });


    if (existing) {

        existing.amount++;

    }

    else {

        collection.push({

            id: card.id,

            name: card.name,

            image: getCardImage(card),

            amount: 1

        });

    }


    saveCollection();


    alert(
        card.name +
        " added to your collection."
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

        container.innerHTML =
            "<p>Your collection is empty.</p>";

        return;

    }


    collection.forEach(function(card) {

        const element =
            document.createElement("div");


        element.className =
            "card";


        let imageHTML = "";


        if (card.image) {

            const proxyImage =
                MTG_PROXY +
                "/api/cards/image?url=" +
                encodeURIComponent(card.image);


            imageHTML =
                '<img src="' +
                proxyImage +
                '" alt="' +
                escapeHTML(card.name) +
                '" loading="lazy">';

        }


        element.innerHTML =
            imageHTML +

            "<h3>" +
            escapeHTML(card.name) +
            "</h3>" +

            "<p>Quantity: " +
            card.amount +
            "</p>" +

            '<button class="removeCollectionButton">' +
            "Remove One" +
            "</button>";


        element
            .querySelector(
                ".removeCollectionButton"
            )
            .addEventListener(
                "click",
                function() {

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
        collection.find(function(item) {

            return item.id === id;

        });


    if (!card) {

        return;

    }


    card.amount--;


    if (card.amount <= 0) {

        collection =
            collection.filter(function(item) {

                return item.id !== id;

            });

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

        container.innerHTML =
            "<p>You don't have any decks yet.</p>";

        return;

    }


    decks.forEach(function(deck) {

        const element =
            document.createElement("div");


        element.className =
            "deck";


        if (!Array.isArray(deck.cards)) {

            deck.cards = [];

        }


        const cardCount =
            deck.cards.reduce(
                function(total, card) {

                    return total +
                        Number(card.amount || 0);

                },
                0
            );


        let sourceHTML = "";


        if (deck.source === "MTGJSON") {

            sourceHTML =
                "<p><small>Prebuilt Deck</small></p>";

        }


        element.innerHTML =
            "<h3>" +
            escapeHTML(deck.name) +
            "</h3>" +

            "<p>" +
            cardCount +
            " cards</p>" +

            sourceHTML +

            '<div class="deckButtons">' +

            '<button class="openButton">' +
            "Open" +
            "</button>" +

            '<button class="renameButton">' +
            "Rename" +
            "</button>" +

            '<button class="deleteButton">' +
            "Delete" +
            "</button>" +

            "</div>";


        element
            .querySelector(
                ".openButton"
            )
            .addEventListener(
                "click",
                function() {

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
                function() {

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
                function() {

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
        decks.find(function(deck) {

            return deck.id === deckId;

        });


    if (!deck) {

        alert(
            "Deck not found."
        );

        return;

    }


    if (!Array.isArray(deck.cards)) {

        deck.cards = [];

    }


    const existing =
        deck.cards.find(function(item) {

            return item.id === card.id;

        });


    if (existing) {

        existing.amount++;

    }

    else {

        deck.cards.push({

            id: card.id,

            name: card.name,

            image: getCardImage(card),

            amount: 1

        });

    }


    saveDecks();


    alert(
        card.name +
        " added to " +
        deck.name +
        "."
    );


    renderDecks();

}


// ======================================================
// OPEN DECK
// ======================================================

function openDeck(deckId) {

    const deck =
        decks.find(function(deck) {

            return deck.id === deckId;

        });


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

        container.innerHTML =
            "<p>This deck is empty.</p>";

        showPage(
            "deckViewPage"
        );

        return;

    }


    deck.cards.forEach(function(card) {

        const element =
            document.createElement("div");


        element.className =
            "card";


        let imageHTML = "";


        if (card.image) {

            const proxyImage =
                MTG_PROXY +
                "/api/cards/image?url=" +
                encodeURIComponent(card.image);


            imageHTML =
                '<img src="' +
                proxyImage +
                '" alt="' +
                escapeHTML(card.name) +
                '" loading="lazy">';

        }


        element.innerHTML =
            imageHTML +

            "<h3>" +
            escapeHTML(card.name) +
            "</h3>" +

            "<p>Quantity: " +
            card.amount +
            "</p>" +

            '<button class="removeDeckCardButton">' +
            "Remove One" +
            "</button>";


        element
            .querySelector(
                ".removeDeckCardButton"
            )
            .addEventListener(
                "click",
                function() {

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
        decks.find(function(deck) {

            return deck.id === deckId;

        });


    if (!deck) {

        return;

    }


    const card =
        deck.cards.find(function(item) {

            return item.id === cardId;

        });


    if (!card) {

        return;

    }


    card.amount--;


    if (card.amount <= 0) {

        deck.cards =
            deck.cards.filter(function(item) {

                return item.id !== cardId;

            });

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
        decks.find(function(deck) {

            return deck.id === deckId;

        });


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
        decks.find(function(deck) {

            return deck.id === deckId;

        });


    if (!deck) {

        return;

    }


    const confirmed =
        confirm(
            'Delete "' +
            deck.name +
            '"?'
        );


    if (!confirmed) {

        return;

    }


    decks =
        decks.filter(function(deck) {

            return deck.id !== deckId;

        });


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
// Hier staan ALLEEN metadata.
//
// Er worden bij het openen van deze pagina
// geen decklists geladen.
//
// De volledige decklist wordt pas opgehaald
// wanneer de speler op "Add to My Decks" klikt.
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


    prebuiltDecks.forEach(function(prebuilt) {

        const element =
            document.createElement("div");


        element.className =
            "deck";


        const alreadyAdded =
            decks.some(function(deck) {

                return deck.prebuiltId ===
                    prebuilt.id;

            });


        let buttonText =
            "Add to My Decks";


        if (alreadyAdded) {

            buttonText =
                "Already Added";

        }


        let disabled =
            "";


        if (alreadyAdded) {

            disabled =
                " disabled";

        }


        element.innerHTML =
            "<h3>" +
            escapeHTML(prebuilt.name) +
            "</h3>" +

            "<p>" +
            escapeHTML(prebuilt.description) +
            "</p>" +

            "<p><strong>Difficulty:</strong> " +
            escapeHTML(prebuilt.difficulty) +
            "</p>" +

            "<p><strong>Color:</strong> " +
            escapeHTML(prebuilt.color) +
            "</p>" +

            '<button class="addPrebuiltButton"' +
            disabled +
            ">" +
            buttonText +
            "</button>";


        const button =
            element.querySelector(
                ".addPrebuiltButton"
            );


        if (!alreadyAdded) {

            button.addEventListener(
                "click",
                function() {

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

    });

}


// ======================================================
// ADD PREBUILT DECK
// ======================================================
//
// ALLEEN HET GESELECTEERDE DECK WORDT GELADEN.
//
// Dus:
//
// openen Prebuilt Decks
//        ↓
// alleen metadata
//        ↓
// klik Add
//        ↓
// server haalt één decklist
//        ↓
// opslaan in localStorage
//
// ======================================================

async function addPrebuiltDeck(
    prebuilt,
    button
) {

    const alreadyExists =
        decks.some(function(deck) {

            return deck.prebuiltId ===
                prebuilt.id;

        });


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


        const url =
            MTG_PROXY +
            "/api/prebuilt-decks/" +
            encodeURIComponent(
                prebuilt.mtgjsonName
            );


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }


        const data =
            await response.json();


        if (
            !data ||
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
            prebuilt.name +
            " was added to your decks."
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
        String(value || "");


    return div.innerHTML;

}


// ======================================================
// STARTUP
// ======================================================

console.log(
    "Starting MTG app..."
);


renderCollection();

renderDecks();

renderPrebuiltDecks();


console.log(
    "MTG app.js loaded successfully."
);
