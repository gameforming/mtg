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
// SAVE DATA
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

        document
            .getElementById(page)
            .classList.add("hidden");

    });


    document
        .getElementById(pageId)
        .classList.remove("hidden");


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
        document
            .getElementById("searchResults");


    results.innerHTML =
        "<p>Searching...</p>";


    try {

        const response =
            await fetch(
                `https://api.scryfall.com/cards/search?q=${encodeURIComponent(input)}`
            );


        if (!response.ok) {

            throw new Error(
                "Search failed"
            );

        }


        const data =
            await response.json();


        displaySearchResults(data.data);


    } catch (error) {

        console.error(error);


        results.innerHTML =
            "<p>No cards found.</p>";

    }
}


// ======================================================
// SEARCH RESULTS
// ======================================================

function displaySearchResults(cards) {

    const results =
        document
            .getElementById("searchResults");


    results.innerHTML = "";


    if (!cards || cards.length === 0) {

        results.innerHTML =
            "<p>No cards found.</p>";

        return;

    }


    cards.forEach(card => {

        const image =
            card.image_uris?.normal ||
            card.card_faces?.[0]?.image_uris?.normal;


        if (!image) {

            return;

        }


        const element =
            document.createElement("div");


        element.className =
            "card";


        let deckOptions =
            `<option value="">Add to deck...</option>`;


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

            <select
                onchange="addCardToDeck(
                    '${card.id}',
                    this.value
                )"
            >

                ${deckOptions}

            </select>

            <button
                onclick='addToCollection(${JSON.stringify(card)})'
            >
                Add to Collection
            </button>

        `;


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


    renderCollection();
}


function renderCollection() {

    const container =
        document
            .getElementById("collection");


    container.innerHTML = "";


    if (collection.length === 0) {

        container.innerHTML =
            "<p>Your collection is empty.</p>";

        return;

    }


    collection.forEach(card => {

        const element =
            document.createElement("div");


        element.className =
            "card";


        element.innerHTML = `

            <img
                src="${card.image}"
                alt="${escapeHTML(card.name)}"
            >

            <h3>
                ${escapeHTML(card.name)}
            </h3>

            <p>
                Quantity:
                ${card.amount}
            </p>

            <button
                onclick="removeFromCollection('${card.id}')"
            >
                Remove
            </button>

        `;


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

        id:
            crypto.randomUUID(),

        name:
            name.trim(),

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
        document
            .getElementById("decks");


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


        element.className =
            "deck";


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

                <button
                    onclick="openDeck('${deck.id}')"
                >
                    Open
                </button>

                <button
                    onclick="renameDeck('${deck.id}')"
                >
                    Rename
                </button>

                <button
                    onclick="deleteDeck('${deck.id}')"
                >
                    Delete
                </button>

            </div>

        `;


        container.appendChild(element);

    });
}


// ======================================================
// ADD CARD TO DECK
// ======================================================

function addCardToDeck(cardId, deckId) {

    if (!deckId) {

        return;

    }


    const deck =
        decks.find(
            deck => deck.id === deckId
        );


    if (!deck) {

        return;

    }


    const ownedCard =
        collection.find(
            card => card.id === cardId
        );


    if (!ownedCard) {

        alert(
            "You don't own this card yet!"
        );

        return;

    }


    const existing =
        deck.cards.find(
            card => card.id === cardId
        );


    const currentAmount =
        existing
            ? existing.amount
            : 0;


    if (currentAmount >= ownedCard.amount) {

        alert(
            "You don't own enough copies of this card."
        );

        return;

    }


    if (existing) {

        existing.amount++;

    } else {

        deck.cards.push({

            id: ownedCard.id,

            name: ownedCard.name,

            image: ownedCard.image,

            amount: 1

        });

    }


    saveDecks();


    alert(
        `${ownedCard.name} added to ${deck.name}`
    );

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
        .getElementById("deckViewTitle")
        .textContent =
        deck.name;


    const container =
        document
            .getElementById("deckViewCards");


    container.innerHTML = "";


    if (deck.cards.length === 0) {

        container.innerHTML =
            "<p>This deck is empty.</p>";

    }


    deck.cards.forEach(card => {

        const element =
            document.createElement("div");


        element.className =
            "card";


        element.innerHTML = `

            <img
                src="${card.image}"
                alt="${escapeHTML(card.name)}"
            >

            <h3>
                ${escapeHTML(card.name)}
            </h3>

            <p>
                Quantity:
                ${card.amount}
            </p>

            <button
                onclick="
                    removeCardFromDeck(
                        '${deck.id}',
                        '${card.id}'
                    )
                "
            >
                Remove
            </button>

        `;


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
            card => card.id === cardId
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
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}


// ======================================================
// START
// ======================================================

renderCollection();
renderDecks();
