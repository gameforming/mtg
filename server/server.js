
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
        service: "MTG Scryfall + MTGJSON Proxy"
    });

});


// ======================================================
// SCRYFALL SEARCH
// ======================================================

app.get("/api/cards/search", async (req, res) => {

    try {

        const query =
            String(req.query.q || "").trim();

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

});


// ======================================================
// SCRYFALL IMAGE PROXY
// ======================================================

app.get("/api/cards/image", async (req, res) => {

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

});


// ======================================================
// SINGLE SCRYFALL CARD
// ======================================================

app.get("/api/cards/:id", async (req, res) => {

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

});


// ======================================================
// MTGJSON DECK CACHE
// ======================================================
//
// We halen NIET alle decks naar de browser.
//
// De server gebruikt de MTGJSON DeckList om de juiste
// fileName te vinden.
//
// Daarna wordt alleen het gekozen deck opgehaald.
//
// ======================================================

let deckListCache = null;
let deckListCacheTime = 0;

const DECK_LIST_CACHE_TIME =
    1000 * 60 * 60 * 24;


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
// FIND DECK
// ======================================================

async function findDeck(
    name,
    code
) {

    const list =
        await getDeckList();

    const wantedName =
        String(name)
            .trim()
            .toLowerCase();

    const wantedCode =
        String(code)
            .trim()
            .toLowerCase();


    // --------------------------------------------------
    // First: exact name + code
    // --------------------------------------------------

    let deck =
        list.find(item =>
            String(item.name)
                .trim()
                .toLowerCase() ===
                wantedName
            &&
            String(item.code)
                .trim()
                .toLowerCase() ===
                wantedCode
        );


    if (deck) {
        return deck;
    }


    // --------------------------------------------------
    // Second: exact fileName
    // --------------------------------------------------

    deck =
        list.find(item =>
            String(item.fileName)
                .trim()
                .toLowerCase() ===
                `${wantedName}_${wantedCode}`
        );


    if (deck) {
        return deck;
    }


    // --------------------------------------------------
    // Third: name contains
    // --------------------------------------------------

    deck =
        list.find(item =>
            String(item.name)
                .toLowerCase()
                .includes(wantedName)
            &&
            String(item.code)
                .toLowerCase() ===
                wantedCode
        );


    return deck || null;

}


// ======================================================
// GET PREBUILT DECK
// ======================================================
//
// Example:
//
// /api/prebuilt-decks/DSC/Endless%20Punishment
//
// Only this deck is downloaded.
//
// ======================================================

app.get(
    "/api/prebuilt-decks/:code/:name",
    async (req, res) => {

        try {

            const code =
                req.params.code;

            const name =
                decodeURIComponent(
                    req.params.name
                );


            console.log(
                "Prebuilt deck request:",
                code,
                name
            );


            const deckInfo =
                await findDeck(
                    name,
                    code
                );


            if (!deckInfo) {

                console.error(
                    "MTGJSON deck not found:",
                    code,
                    name
                );

                return res.status(404).json({

                    error:
                        "Prebuilt deck not found.",

                    requested: {
                        code,
                        name
                    }

                });

            }


            console.log(
                "Found MTGJSON deck:",
                deckInfo.fileName
            );


            // --------------------------------------------------
            // IMPORTANT:
            // fileName comes directly from MTGJSON.
            // --------------------------------------------------

            const deckUrl =
                `${MTGJSON_API}/decks/${encodeURIComponent(
                    deckInfo.fileName
                )}.json`;


            console.log(
                "Downloading:",
                deckUrl
            );


            const response =
                await fetch(
                    deckUrl
                );


            if (!response.ok) {

                console.error(
                    "MTGJSON deck download failed:",
                    response.status,
                    deckUrl
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


            // --------------------------------------------------
            // Convert MTGJSON deck cards to our format
            // --------------------------------------------------

            const sourceDeck =
                data.data || data;


            const cards = [];


            // Mainboard

            if (
                Array.isArray(
                    sourceDeck.mainBoard
                )
            ) {

                sourceDeck.mainBoard.forEach(
                    card => {

                        cards.push({

                            id:
                                card.uuid,

                            name:
                                card.name,

                            amount:
                                Number(
                                    card.count || 1
                                ),

                            image:
                                null

                        });

                    }
                );

            }


            // Commander

            if (
                Array.isArray(
                    sourceDeck.commander
                )
            ) {

                sourceDeck.commander.forEach(
                    card => {

                        cards.push({

                            id:
                                card.uuid,

                            name:
                                card.name,

                            amount:
                                Number(
                                    card.count || 1
                                ),

                            image:
                                null,

                            commander:
                                true

                        });

                    }
                );

            }


            // Sideboard

            if (
                Array.isArray(
                    sourceDeck.sideBoard
                )
            ) {

                sourceDeck.sideBoard.forEach(
                    card => {

                        cards.push({

                            id:
                                card.uuid,

                            name:
                                card.name,

                            amount:
                                Number(
                                    card.count || 1
                                ),

                            image:
                                null,

                            sideboard:
                                true

                        });

                    }
                );

            }


            res.json({

                source:
                    "MTGJSON",

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

            });

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
);


// ======================================================
// OPTIONAL: SEARCH AVAILABLE PREBUILT DECKS
// ======================================================
//
// Dit gebruikt alleen metadata.
// Er worden geen kaarten geladen.
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
                    list.filter(deck =>
                    String(deck.name)
                        .toLowerCase()
                        .includes(search)
                    );

            }


            res.json({

                count:
                    results.length,

                decks:
                    results.map(deck => ({

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

                    }))

            });

        }

        catch (error) {

            console.error(
                "Prebuilt deck list error:",
                error
            );

            res.status(500).json({

                error:
                    "Could not load deck list."

            });

        }

    }
);


// ======================================================
// START
// ======================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `MTG proxy running on port ${PORT}`
        );

    }
);

