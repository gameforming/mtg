let collection = JSON.parse(
    localStorage.getItem("mtgCollection")
) || [];


// ===============================
// PAGE NAVIGATION
// ===============================

function showPage(pageId) {

    document.getElementById("searchPage")
        .classList.add("hidden");

    document.getElementById("collectionPage")
        .classList.add("hidden");

    document.getElementById(pageId)
        .classList.remove("hidden");

    if (pageId === "collectionPage") {
        renderCollection();
    }
}


// ===============================
// SEARCH CARD
// ===============================

async function searchCard() {

    const input = document
        .getElementById("searchInput")
        .value
        .trim();

    if (!input) {
        return;
    }

    const results = document.getElementById("searchResults");

    results.innerHTML = "Searching...";

    try {

        const response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(input)}`
        );

        if (!response.ok) {
            throw new Error("Card not found");
        }

        const card = await response.json();

        displaySearchCard(card);

    } catch (error) {

        results.innerHTML = `
            <p>Card not found.</p>
        `;

    }
}


// ===============================
// DISPLAY SEARCH RESULT
// ===============================

function displaySearchCard(card) {

    const results = document.getElementById("searchResults");

    const image =
        card.image_uris?.normal ||
        card.card_faces?.[0]?.image_uris?.normal;

    results.innerHTML = `
        <div class="card">

            <img src="${image}" alt="${card.name}">

            <h3>${card.name}</h3>

            <button onclick='addToCollection(${JSON.stringify(card)})'>
                Add to Collection
            </button>

        </div>
    `;
}


// ===============================
// ADD TO COLLECTION
// ===============================

function addToCollection(card) {

    const existing = collection.find(
        item => item.id === card.id
    );

    if (existing) {

        existing.amount++;

    } else {

        collection.push({
            id: card.id,
            name: card.name,
            image: card.image_uris?.normal ||
                   card.card_faces?.[0]?.image_uris?.normal,
            amount: 1
        });

    }

    saveCollection();

    alert(`${card.name} added to your collection!`);
}


// ===============================
// SAVE COLLECTION
// ===============================

function saveCollection() {

    localStorage.setItem(
        "mtgCollection",
        JSON.stringify(collection)
    );

}


// ===============================
// DISPLAY COLLECTION
// ===============================

function renderCollection() {

    const container =
        document.getElementById("collection");

    container.innerHTML = "";

    if (collection.length === 0) {

        container.innerHTML =
            "<p>Your collection is empty.</p>";

        return;
    }

    collection.forEach(card => {

        const element = document.createElement("div");

        element.className = "card";

        element.innerHTML = `
            <img src="${card.image}" alt="${card.name}">

            <h3>${card.name}</h3>

            <p>Quantity: ${card.amount}</p>

            <button onclick="removeFromCollection('${card.id}')">
                Remove
            </button>
        `;

        container.appendChild(element);

    });
}


// ===============================
// REMOVE CARD
// ===============================

function removeFromCollection(id) {

    const card = collection.find(
        item => item.id === id
    );

    if (!card) return;

    card.amount--;

    if (card.amount <= 0) {

        collection = collection.filter(
            item => item.id !== id
        );

    }

    saveCollection();

    renderCollection();
}


// ===============================
// LOAD COLLECTION ON START
// ===============================

renderCollection();
