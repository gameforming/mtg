import express from "express";

const app = express();

const PORT =
process.env.PORT || 10000;

// ======================================================
// CONFIG
// ======================================================

const SCRYFALL_API =
"https://api.scryfall.com";

const MTGJSON_API =
"https://mtgjson.com/api/v5";

const MTGJSON_DECK_LIST =
`${MTGJSON_API}/DeckList.json`;

// ======================================================
// CACHE
// ======================================================

// Deck metadata.
// Wordt gevuld met DeckList.json.
let deckIndex = [];

// Cache voor daadwerkelijk geladen decks.
// Hierdoor hoeft een gekozen deck niet steeds opnieuw
// van MTGJSON geladen te worden.
const deckCache =
new Map();

// Tijdstip waarop DeckList voor het laatst geladen is.
let deckIndexLoadedAt = 0;

// 6 uur.
// Render kan hierdoor lang blijven draaien zonder
// steeds opnieuw DeckList.json te downloaden.
const DECK_INDEX_CACHE_TIME =
6 * 60 * 60 * 1000;

// ======================================================
// CORS
// ======================================================

app.use(
(req, res, next) => {

```
    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {

        return res.sendStatus(204);

    }

    next();

}
```

);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
"/",
(req, res) => {

```
    res.json({

        online: true,

        service:
            "MTG Scryfall + MTGJSON Proxy",

        deckIndexLoaded:
            deckIndex.length > 0,

        deckCount:
            deckIndex.length,

        cachedDecks:
            deckCache.size

    });

}
```

);

// ======================================================
// FETCH JSON HELPER
// ======================================================

async function fetchJSON(
url
) {

```
const response =
    await fetch(
        url,
        {

            headers: {

                "Accept":
                    "application/json",

                "User-Agent":
                    "MTG-Game/1.0"

            }

        }
    );


if (!response.ok) {

    throw new Error(
        `Request failed: ${response.status} ${response.statusText}`
    );

}


return await response.json();
```

}

// ======================================================
// LOAD MTGJSON DECK INDEX
// ======================================================

async function loadDeckIndex(
force = false
) {

```
const now =
    Date.now();


// ------------------------------------------
// USE CACHE
// ------------------------------------------

if (
    !force &&
    deckIndex.length > 0 &&
    now - deckIndexLoadedAt <
        DECK_INDEX_CACHE_TIME
) {

    return deckIndex;

}


console.log(
    "Loading MTGJSON DeckList bulk data..."
);


try {

    const data =
        await fetchJSON(
            MTGJSON_DECK_LIST
        );


    /*
     * MTGJSON DeckList.json heeft een data-array.
     */

    if (
        !data ||
        !Array.isArray(data.data)
    ) {

        throw new Error(
            "Invalid MTGJSON DeckList format."
        );

    }


    deckIndex =
        data.data;


    deckIndexLoadedAt =
        now;


    console.log(
        `Loaded ${deckIndex.length} MTGJSON decks.`
    );


    return deckIndex;

}

catch (error) {

    console.error(
        "Could not load MTGJSON DeckList:",
        error
    );


    // Als we een oude cache hebben,
    // blijven we die gebruiken.
    if (deckIndex.length > 0) {

        console.log(
            "Using previous deck index."
        );

        return deckIndex;

    }


    throw error;

}
```

}

// ======================================================
// FIND DECK
// ======================================================

function findDeck(
query
) {

```
const search =
    String(
        query || ""
    )
    .trim()
    .toLowerCase();


if (!search) {
    return null;
}


// ------------------------------------------
// EXACT NAME
// ------------------------------------------

let result =
    deckIndex.find(
        deck =>
            String(
                deck.name || ""
            )
            .toLowerCase() ===
            search
    );


if (result) {
    return result;
}


// ------------------------------------------
// EXACT CODE
// ------------------------------------------

result =
    deckIndex.find(
        deck =>
            String(
                deck.code || ""
            )
            .toLowerCase() ===
            search
    );


if (result) {
    return result;
}


// ------------------------------------------
// ID
// ------------------------------------------

result =
    deckIndex.find(
        deck =>
            String(
                deck.id || ""
            )
            .toLowerCase() ===
            search
    );


if (result) {
    return result;
}


// ------------------------------------------
// PARTIAL NAME
// ------------------------------------------

result =
    deckIndex.find(
        deck =>
            String(
                deck.name || ""
            )
            .toLowerCase()
            .includes(search)
    );


return result || null;
```

}

// ======================================================
// NORMALIZE MTGJSON CARD
// ======================================================

function normalizeCard(
card
) {

```
if (!card) {
    return null;
}


/*
 * MTGJSON kan verschillende velden gebruiken
 * afhankelijk van het deckbestand.
 *
 * UUID is de belangrijkste identifier.
 */

const id =
    card.uuid ||
    card.scryfallId ||
    card.identifiers?.scryfallId ||
    card.id ||
    null;


const name =
    card.name ||
    card.cardName ||
    "Unknown Card";


const amount =
    Number(
        card.count ||
        card.quantity ||
        1
    );


if (!id) {

    console.warn(
        "MTGJSON card without ID:",
        name
    );

    return null;

}


return {

    id,

    name,

    amount:

        Number.isFinite(amount) &&
        amount > 0
            ? amount
            : 1,

    image: null

};
```

}

// ======================================================
// ADD SECTION CARDS
// ======================================================

function addSection(
target,
section
) {

```
if (!Array.isArray(section)) {
    return;
}


section.forEach(
    cardData => {

        const card =
            normalizeCard(
                cardData
            );


        if (!card) {
            return;
        }


        const existing =
            target.find(
                item =>
                    item.id ===
                    card.id
            );


        if (existing) {

            existing.amount +=
                card.amount;

        }

        else {

            target.push(
                card
            );

        }

    }
);
```

}

// ======================================================
// EXTRACT DECK CARDS
// ======================================================

function extractDeckCards(
deckData
) {

```
const cards = [];


/*
 * Commander
 */

addSection(
    cards,
    deckData.commander
);


/*
 * Mainboard
 */

addSection(
    cards,
    deckData.mainBoard
);


/*
 * Sideboard
 */

addSection(
    cards,
    deckData.sideBoard
);


/*
 * Maybe board
 */

addSection(
    cards,
    deckData.maybeboard
);


/*
 * Sommige MTGJSON datasets kunnen
 * andere sections bevatten.
 */

addSection(
    cards,
    deckData.tokens
);


return cards;
```

}

// ======================================================
// LOAD ONE DECK FILE
// ======================================================

async function loadOneDeck(
deck
) {

```
const cacheKey =
    String(
        deck.code ||
        deck.id ||
        deck.name
    );


// ------------------------------------------
// CACHE
// ------------------------------------------

if (
    deckCache.has(
        cacheKey
    )
) {

    console.log(
        "Using cached deck:",
        deck.name
    );


    return deckCache.get(
        cacheKey
    );

}


/*
 * MTGJSON DeckList bevat het bestand van het deck.
 *
 * We proberen eerst fileName.
 */

let fileName =
    deck.fileName ||
    deck.filename ||
    deck.file ||
    null;


if (!fileName) {

    throw new Error(
        `No fileName available for deck: ${deck.name}`
    );

}


/*
 * Sommige entries kunnen al een path bevatten.
 *
 * We voorkomen dubbele .json.
 */

if (
    !fileName
        .toLowerCase()
        .endsWith(".json")
) {

    fileName += ".json";

}


/*
 * Deck-bestanden staan in:
 *
 * /api/v5/decks/
 */

const url =
    `${MTGJSON_API}/decks/${encodeURIComponent(
        fileName
    )}`;


console.log(
    "Loading one MTGJSON deck:",
    deck.name,
    url
);


const data =
    await fetchJSON(
        url
    );


const cards =
    extractDeckCards(
        data
    );


const result = {

    id:
        deck.id ||
        deck.code ||
        crypto.randomUUID(),

    code:
        deck.code ||
        null,

    name:
        deck.name ||
        "Unknown Deck",

    type:
        deck.type ||
        null,

    releaseDate:
        deck.releaseDate ||
        null,

    cards

};


/*
 * Cache alleen dit deck.
 */

deckCache.set(
    cacheKey,
    result
);


return result;
```

}

// ======================================================
// PREBUILT DECK LIST
// ======================================================
//
// BELANGRIJK:
//
// Dit endpoint geeft alleen metadata terug.
// Geen volledige decklists.
//
// Hierdoor krijgt de browser niet honderden
// volledige decks.
//
// ======================================================

app.get(
"/api/prebuilt-decks",
async (req, res) => {

```
    try {

        const decks =
            await loadDeckIndex();


        /*
         * Alleen nuttige informatie terugsturen.
         */

        const result =
            decks.map(
                deck => ({

                    id:
                        deck.id ||
                        deck.code ||
                        deck.name,

                    code:
                        deck.code ||
                        null,

                    name:
                        deck.name ||
                        "Unknown Deck",

                    type:
                        deck.type ||
                        null,

                    releaseDate:
                        deck.releaseDate ||
                        null,

                    fileName:
                        deck.fileName ||
                        null

                })
            );


        res.json({

            count:
                result.length,

            decks:
                result

        });

    }

    catch (error) {

        console.error(
            "Prebuilt deck list error:",
            error
        );


        res.status(500).json({

            error:
                "Could not load MTGJSON deck list."

        });

    }

}
```

);

// ======================================================
// GET ONE PREBUILT DECK
// ======================================================
//
// Browser vraagt bijvoorbeeld:
//
// /api/prebuilt-decks/ENDLESS%20PUNISHMENT
//
// Alleen DAT deck wordt geladen.
//
// ======================================================

app.get(
"/api/prebuilt-decks/:id",
async (req, res) => {

```
    try {

        await loadDeckIndex();


        const query =
            decodeURIComponent(
                req.params.id
            );


        const deck =
            findDeck(
                query
            );


        if (!deck) {

            return res.status(404).json({

                error:
                    "Prebuilt deck not found.",

                query

            });

        }


        const result =
            await loadOneDeck(
                deck
            );


        res.json(
            result
        );

    }

    catch (error) {

        console.error(
            "Prebuilt deck error:",
            error
        );


        res.status(500).json({

            error:
                "Could not load prebuilt deck.",

            message:
                error.message

        });

    }

}
```

);

// ======================================================
// SEARCH PREBUILT DECKS
// ======================================================
//
// Handig voor later.
//
// Bijvoorbeeld:
//
// /api/prebuilt-decks/search?q=commander
//
// ======================================================

app.get(
"/api/prebuilt-decks/search",
async (req, res) => {

```
    try {

        await loadDeckIndex();


        const query =
            String(
                req.query.q || ""
            )
            .trim()
            .toLowerCase();


        if (!query) {

            return res.status(400).json({

                error:
                    "Missing search query."

            });

        }


        const results =
            deckIndex
                .filter(
                    deck => {

                        const name =
                            String(
                                deck.name || ""
                            )
                            .toLowerCase();


                        const code =
                            String(
                                deck.code || ""
                            )
                            .toLowerCase();


                        const type =
                            String(
                                deck.type || ""
                            )
                            .toLowerCase();


                        return (

                            name.includes(query) ||

                            code.includes(query) ||

                            type.includes(query)

                        );

                    }
                )
                .map(
                    deck => ({

                        id:
                            deck.id ||
                            deck.code ||
                            deck.name,

                        code:
                            deck.code ||
                            null,

                        name:
                            deck.name ||
                            "Unknown Deck",

                        type:
                            deck.type ||
                            null,

                        releaseDate:
                            deck.releaseDate ||
                            null

                    })
                );


        res.json({

            count:
                results.length,

            decks:
                results

        });

    }

    catch (error) {

        console.error(
            "Prebuilt deck search error:",
            error
        );


        res.status(500).json({

            error:
                "Could not search prebuilt decks."

        });

    }

}
```

);

// ======================================================
// CLEAR DECK CACHE
// ======================================================
//
// Alleen handig voor development/admin.
// Niet nodig voor de frontend.
//
// ======================================================

app.get(
"/api/prebuilt-decks/cache/clear",
(req, res) => {

```
    const count =
        deckCache.size;


    deckCache.clear();


    res.json({

        success:
            true,

        cleared:
            count

    });

}
```

);

// ======================================================
// CARD SEARCH
// ======================================================

app.get(
"/api/cards/search",
async (req, res) => {

```
    try {

        const query =
            String(
                req.query.q || ""
            ).trim();


        if (!query) {

            return res.status(400).json({

                error:
                    "Missing search query."

            });

        }


        const url =
            new URL(
                `${SCRYFALL_API}/cards/search`
            );


        url.searchParams.set(
            "q",
            query
        );


        const response =
            await fetch(
                url,
                {

                    headers: {

                        "Accept":
                            "application/json",

                        "User-Agent":
                            "MTG-Game/1.0 (GitHub Pages)"

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            return res
                .status(response.status)
                .json(data);

        }


        res.json(
            data
        );

    }

    catch (error) {

        console.error(
            "Scryfall search error:",
            error
        );


        res.status(500).json({

            error:
                "Could not reach Scryfall."

        });

    }

}
```

);

// ======================================================
// CARD IMAGE PROXY
// IMPORTANT:
// MUST COME BEFORE /api/cards/:id
// ======================================================

app.get(
"/api/cards/image",
async (req, res) => {

```
    try {

        const imageUrl =
            String(
                req.query.url || ""
            ).trim();


        if (!imageUrl) {

            return res.status(400).json({

                error:
                    "Missing image URL."

            });

        }


        let parsed;


        try {

            parsed =
                new URL(
                    imageUrl
                );

        }

        catch {

            return res.status(400).json({

                error:
                    "Invalid image URL."

            });

        }


        // ------------------------------------------
        // ONLY SCRYFALL IMAGE HOST
        // ------------------------------------------

        if (
            parsed.hostname !==
            "cards.scryfall.io"
        ) {

            return res.status(403).json({

                error:
                    "Invalid image host."

            });

        }


        console.log(
            "Proxying image:",
            imageUrl
        );


        const response =
            await fetch(
                imageUrl,
                {

                    headers: {

                        "User-Agent":
                            "MTG-Game/1.0",

                        "Accept":
                            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"

                    }

                }
            );


        if (!response.ok) {

            console.error(
                "Scryfall image error:",
                response.status,
                imageUrl
            );


            return res
                .status(
                    response.status
                )
                .send(
                    "Image unavailable"
                );

        }


        const contentType =
            response.headers.get(
                "content-type"
            );


        res.setHeader(
            "Content-Type",
            contentType ||
            "image/jpeg"
        );


        res.setHeader(
            "Cache-Control",
            "public, max-age=86400"
        );


        const buffer =
            Buffer.from(
                await response.arrayBuffer()
            );


        res.send(
            buffer
        );

    }

    catch (error) {

        console.error(
            "Image proxy error:",
            error
        );


        res.status(500).send(
            "Could not load image."
        );

    }

}
```

);

// ======================================================
// GET SINGLE CARD
// ======================================================
//
// IMPORTANT:
// gameEngine.js moet deze proxy gebruiken,
// NIET rechtstreeks api.scryfall.com.
//
// ======================================================

app.get(
"/api/cards/:id",
async (req, res) => {

```
    try {

        const id =
            encodeURIComponent(
                req.params.id
            );


        const response =
            await fetch(
                `${SCRYFALL_API}/cards/${id}`,
                {

                    headers: {

                        "Accept":
                            "application/json",

                        "User-Agent":
                            "MTG-Game/1.0 (GitHub Pages)"

                    }

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            return res
                .status(
                    response.status
                )
                .json(
                    data
                );

        }


        res.json(
            data
        );

    }

    catch (error) {

        console.error(
            "Scryfall card error:",
            error
        );


        res.status(500).json({

            error:
                "Could not reach Scryfall."

        });

    }

}
```

);

// ======================================================
// START SERVER
// ======================================================

app.listen(
PORT,
"0.0.0.0",
async () => {

```
    console.log(
        `MTG proxy running on port ${PORT}`
    );


    /*
     * Laad de kleine DeckList bulk-index op de
     * achtergrond bij het starten.
     *
     * We wachten hier NIET op voordat Express
     * begint te luisteren.
     */

    try {

        await loadDeckIndex();


        console.log(
            "MTGJSON deck index ready."
        );

    }

    catch (error) {

        console.error(
            "Initial MTGJSON load failed:",
            error.message
        );

        console.log(
            "The server is still running."
        );

    }

}
```

);
