
import express from "express";

const app = express();

const PORT = process.env.PORT || 10000;

const SCRYFALL_API = "https://api.scryfall.com";
const MTGJSON_API = "https://mtgjson.com/api/v5";


// ======================================================
// CORS
// ======================================================

app.use((req, res, next) => {

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

});


// ======================================================
// HEALTH
// ======================================================

app.get("/", (req, res) => {

    res.json({
        online: true,
        service: "MTG Proxy",
        sources: {
            cards: "Scryfall",
            prebuiltDecks: "MTGJSON"
        }
    });

});


// ======================================================
// SCRYFALL SEARCH
// ======================================================

app.get(
    "/api/cards/search",
    async (req, res) => {

        try {

            const query =
                String(
                    req.query.q || ""
                ).trim();


            if (!query) {

                return res.status(400).json({
                    error: "Missing search query."
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
                                "MTG-Game/1.0"
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


            res.json(data);

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
);


// ======================================================
// SCRYFALL IMAGE PROXY
// ======================================================

app.get(
    "/api/cards/image",
    async (req, res) => {

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
                    new URL(imageUrl);

            }

            catch {

                return res.status(400).json({
                    error:
                        "Invalid image URL."
                });

            }


            // Alleen Scryfall afbeeldingen toestaan

            if (
                parsed.hostname !==
                "cards.scryfall.io"
            ) {

                return res.status(403).json({
                    error:
                        "Invalid image host."
                });

            }


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

                return res
                    .status(response.status)
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


            res.send(buffer);

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
);


// ======================================================
// SINGLE SCRYFALL CARD
// ======================================================

app.get(
    "/api/cards/:id",
    async (req, res) => {

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
                                "MTG-Game/1.0"
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


            res.json(data);

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
);


// ======================================================
// MTGJSON DECK LIST CACHE
// ======================================================
//
// MTGJSON heeft een officiële DeckList.json.
// Deze bevat metadata zoals:
//
// - name
// - code
// - fileName
// - releaseDate
// - type
//
// We downloaden deze lijst maximaal één keer per 24 uur.
//
// ======================================================

let deckListCache = null;

let deckListCacheTime = 0;

const DECK_LIST_CACHE_TIME =
    1000 *
    60 *
    60 *
    24;


// ======================================================
// INDIVIDUAL DECK CACHE
// ======================================================
//
// Hier bewaren we individuele decks die al zijn opgehaald.
//
// Daardoor hoeft bijvoorbeeld:
//
// Endless Punishment
//
// niet steeds opnieuw van MTGJSON gehaald te worden.
//
// ======================================================

const deckCache =
    new Map();


// ======================================================
// LOAD MTGJSON DECK LIST
// ======================================================

async function getDeckList() {

    const now =
        Date.now();


    if (
        deckListCache &&
        now - deckListCacheTime <
            DECK_LIST_CACHE_TIME
    ) {

        return deckListCache;

    }


    console.log(
        "Loading MTGJSON DeckList..."
    );


    const response =
        await fetch(
            `${MTGJSON_API}/DeckList.json`
        );


    if (!response.ok) {

        throw new Error(
            `MTGJSON DeckList returned ${response.status}`
        );

    }


    const data =
        await response.json();


    if (
        !data ||
        !Array.isArray(data.data)
    ) {

        throw new Error(
            "Invalid MTGJSON DeckList."
        );

    }


    deckListCache =
        data.data;


    deckListCacheTime =
        now;


    console.log(
        `MTGJSON DeckList loaded: ${deckListCache.length} decks`
    );


    return deckListCache;

}


// ======================================================
// FIND MTGJSON DECK BY NAME
// ======================================================
//
// De app stuurt:
//
// /api/prebuilt-decks/Boros%20Convoke
//
// Wij zoeken uitsluitend in MTGJSON.
//
// ======================================================

async function findDeckByName(
    requestedName
) {

    const list =
        await getDeckList();


    const wanted =
        String(
            requestedName || ""
        )
        .trim()
        .toLowerCase();


    if (!wanted) {

        return null;

    }


    // --------------------------------------------------
    // EXACT NAME
    // --------------------------------------------------

    let deck =
        list.find(
            item =>
                String(item.name || "")
                    .trim()
                    .toLowerCase() ===
                wanted
        );


    if (deck) {

        return deck;

    }


    // --------------------------------------------------
    // NORMALIZED NAME
    // --------------------------------------------------
    //
    // Maakt bijvoorbeeld:
    //
    // "Boros   Convoke"
    //
    // gelijk aan:
    //
    // "Boros Convoke"
    //
    // --------------------------------------------------

    const normalize =
        value =>
            String(value || "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ");


    deck =
        list.find(
            item =>
                normalize(item.name) ===
                normalize(requestedName)
        );


    if (deck) {

        return deck;

    }


    return null;

}


// ======================================================
// CONVERT MTGJSON CARD
// ======================================================

function convertCard(card) {

    return {

        id:
            card.uuid ||
            card.scryfallId ||
            card.name,

        name:
            card.name,

        amount:
            Number(
                card.count ||
                card.quantity ||
                1
            ),

        image:
            null

    };

}


// ======================================================
// CONVERT MTGJSON DECK
// ======================================================

function convertDeck(
    sourceDeck,
    deckInfo
) {

    const cards = [];


    // --------------------------------------------------
    // MAINBOARD
    // --------------------------------------------------

    if (
        Array.isArray(
            sourceDeck.mainBoard
        )
    ) {

        sourceDeck.mainBoard.forEach(
            card => {

                cards.push(
                    convertCard(card)
                );

            }
        );

    }


    // --------------------------------------------------
    // COMMANDER
    // --------------------------------------------------

    if (
        Array.isArray(
            sourceDeck.commander
        )
    ) {

        sourceDeck.commander.forEach(
            card => {

                cards.push({

                    ...convertCard(card),

                    commander: true

                });

            }
        );

    }


    // --------------------------------------------------
    // SIDEBOARD
    // --------------------------------------------------

    if (
        Array.isArray(
            sourceDeck.sideBoard
        )
    ) {

        sourceDeck.sideBoard.forEach(
            card => {

                cards.push({

                    ...convertCard(card),

                    sideboard: true

                });

            }
        );

    }


    return {

        source: "MTGJSON",

        name:
            sourceDeck.name ||
            deckInfo.name,

        code:
            sourceDeck.code ||
            deckInfo.code,

        fileName:
            deckInfo.fileName,

        type:
            sourceDeck.type ||
            deckInfo.type,

        releaseDate:
            sourceDeck.releaseDate ||
            deckInfo.releaseDate,

        cards

    };

}


// ======================================================
// GET PREBUILT DECK
// ======================================================
//
// IMPORTANT:
//
// Deze route gebruikt ALLEEN MTGJSON.
//
// Bijvoorbeeld:
//
// /api/prebuilt-decks/Boros%20Convoke
//
// ======================================================

app.get(
    "/api/prebuilt-decks/:name",
    async (req, res) => {

        try {

            const name =
                decodeURIComponent(
                    req.params.name
                );


            console.log(
                "======================================"
            );


            console.log(
                "MTGJSON prebuilt deck request:",
                name
            );


            // --------------------------------------------------
            // FIND IN MTGJSON
            // --------------------------------------------------

            const deckInfo =
                await findDeckByName(
                    name
                );


            if (!deckInfo) {

                console.error(
                    "MTGJSON deck not found:",
                    name
                );


                return res.status(404).json({

                    error:
                        "Prebuilt deck not found in MTGJSON.",

                    requestedName:
                        name

                });

            }


            console.log(
                "MTGJSON deck found:",
                deckInfo.name,
                deckInfo.code,
                deckInfo.fileName
            );


            // --------------------------------------------------
            // CACHE
            // --------------------------------------------------

            const cacheKey =
                deckInfo.fileName;


            if (
                deckCache.has(
                    cacheKey
                )
            ) {

                console.log(
                    "Using cached deck:",
                    cacheKey
                );


                return res.json(
                    deckCache.get(
                        cacheKey
                    )
                );

            }


            // --------------------------------------------------
            // DOWNLOAD ONLY THIS DECK
            // --------------------------------------------------

            const deckUrl =
                `${MTGJSON_API}/decks/` +
                encodeURIComponent(
                    deckInfo.fileName
                ) +
                ".json";


            console.log(
                "Downloading MTGJSON deck:",
                deckUrl
            );


            const response =
                await fetch(
                    deckUrl
                );


            if (!response.ok) {

                console.error(
                    "MTGJSON deck download failed:",
                    response.status
                );


                return res
                    .status(response.status)
                    .json({

                        error:
                            "Could not download MTGJSON deck.",

                        fileName:
                            deckInfo.fileName

                    });

            }


            const data =
                await response.json();


            const sourceDeck =
                data.data ||
                data;


            // --------------------------------------------------
            // CONVERT
            // --------------------------------------------------

            const result =
                convertDeck(
                    sourceDeck,
                    deckInfo
                );


            // --------------------------------------------------
            // CACHE
            // --------------------------------------------------

            deckCache.set(
                cacheKey,
                result
            );


            console.log(
                "Deck loaded:",
                result.name,
                "| Cards:",
                result.cards.length
            );


            res.json(
                result
            );

        }

        catch (error) {

            console.error(
                "MTGJSON prebuilt deck error:",
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
);


// ======================================================
// GET AVAILABLE MTGJSON PREBUILT DECKS
// ======================================================
//
// Deze endpoint kan later gebruikt worden om automatisch
// ALLE beschikbare decks van MTGJSON te tonen.
//
// Er worden hier GEEN decklists geladen.
//
// Alleen metadata.
//
// ======================================================

app.get(
    "/api/prebuilt-decks",
    async (req, res) => {

        try {

            const list =
                await getDeckList();


            const search =
                String(
                    req.query.search || ""
                )
                .trim()
                .toLowerCase();


            let results =
                list;


            if (search) {

                results =
                    list.filter(
                        deck =>
                            String(
                                deck.name || ""
                            )
                            .toLowerCase()
                            .includes(
                                search
                            )
                    );

            }


            res.json({

                source:
                    "MTGJSON",

                count:
                    results.length,

                decks:
                    results.map(
                        deck => ({

                            code:
                                deck.code,

                            name:
                                deck.name,

                            fileName:
                                deck.fileName,

                            type:
                                deck.type,

                            releaseDate:
                                deck.releaseDate

                        })
                    )

            });

        }

        catch (error) {

            console.error(
                "MTGJSON deck list error:",
                error
            );


            res.status(500).json({

                error:
                    "Could not load MTGJSON deck list."

            });

        }

    }
);


// ======================================================
// CACHE INFO
// ======================================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            online: true,

            source: {

                cards:
                    "Scryfall",

                prebuiltDecks:
                    "MTGJSON"

            },

            mtgjson: {

                deckListLoaded:
                    Boolean(
                        deckListCache
                    ),

                deckCount:
                    deckListCache
                        ? deckListCache.length
                        : 0,

                cachedDecks:
                    deckCache.size

            }

        });

    }
);


// ======================================================
// 404
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({

            error:
                "Route not found.",

            path:
                req.originalUrl

        });

    }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "======================================"
        );

        console.log(
            "MTG proxy running"
        );

        console.log(
            `Port: ${PORT}`
        );

        console.log(
            "Card source: Scryfall"
        );

        console.log(
            "Prebuilt deck source: MTGJSON"
        );

        console.log(
            "======================================"
        );

    }
);

