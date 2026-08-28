```javascript
import express from "express";

const app = express();

const PORT = process.env.PORT || 10000;

const SCRYFALL_API =
    "https://api.scryfall.com";

const MTGJSON_API =
    "https://mtgjson.com/api/v5";


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
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {

    res.json({

        online: true,

        service:
            "MTG Scryfall + MTGJSON Proxy",

        endpoints: [

            "/api/cards/search",

            "/api/cards/:id",

            "/api/cards/image",

            "/api/prebuilt-decks",

            "/api/prebuilt-decks/:id"

        ]

    });

});


// ======================================================
// CARD SEARCH
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
// CARD IMAGE PROXY
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
// GET SINGLE CARD
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
// PREBUILT DECK METADATA
// ======================================================
//
// BELANGRIJK:
//
// Deze lijst bevat GEEN kaarten.
//
// Daardoor wordt bij:
// GET /api/prebuilt-decks
//
// alleen een kleine JSON response gestuurd.
//
// ======================================================

const PREBUILT_DECKS = [

    {
        id: "easy-starter",

        name: "Easy Starter Deck",

        description:
            "Een eenvoudig deck om Magic te leren.",

        difficulty: "Easy",

        color: "White",

        // MTGJSON set/deck identifier
        setCode: "FDN",

        deckName:
            "Foundations Starter Kit",

        type:
            "preconstructed"

    },


    {
        id: "complex-commander",

        name: "Complex Commander Deck",

        description:
            "Een complex Commander deck met veel interactie.",

        difficulty: "Hard",

        color: "Black Red",

        setCode: "DMC",

        deckName:
            "Commander Deck",

        type:
            "preconstructed"

    }

];


// ======================================================
// GET PREBUILT DECK LIST
// ======================================================
//
// Dit endpoint geeft alleen metadata.
//
// GEEN volledige decklists.
//
// ======================================================

app.get(
    "/api/prebuilt-decks",
    (req, res) => {

        res.json({

            decks:
                PREBUILT_DECKS

        });

    }
);


// ======================================================
// CACHE
// ======================================================
//
// Een gekozen deck kan gecached worden.
//
// Hierdoor hoeft Render niet telkens
// opnieuw dezelfde MTGJSON-data te downloaden.
//
// ======================================================

const prebuiltCache =
    new Map();


// ======================================================
// GET ONE PREBUILT DECK
// ======================================================
//
// GET:
//
// /api/prebuilt-decks/easy-starter
//
// Alleen dit gekozen deck wordt geladen.
//
// ======================================================

app.get(
    "/api/prebuilt-decks/:id",
    async (req, res) => {

        try {

            const id =
                String(
                    req.params.id
                );


            const prebuilt =
                PREBUILT_DECKS.find(
                    deck =>
                        deck.id === id
                );


            if (!prebuilt) {

                return res.status(404).json({

                    error:
                        "Prebuilt deck not found.",

                    id:
                        id

                });

            }


            // ------------------------------------------
            // CACHE
            // ------------------------------------------

            if (
                prebuiltCache.has(id)
            ) {

                console.log(
                    "Prebuilt cache hit:",
                    id
                );


                return res.json(
                    prebuiltCache.get(id)
                );

            }


            console.log(
                "Loading MTGJSON deck:",
                prebuilt.name
            );


            // ------------------------------------------
            // LOAD MTGJSON SET
            // ------------------------------------------
            //
            // We gebruiken de normale set JSON.
            //
            // Bijvoorbeeld:
            //
            // https://mtgjson.com/api/v5/FDN.json
            //
            // ------------------------------------------

            const response =
                await fetch(
                    `${MTGJSON_API}/${prebuilt.setCode}.json`
                );


            if (!response.ok) {

                throw new Error(
                    `MTGJSON returned ${response.status}`
                );

            }


            const setData =
                await response.json();


            // ------------------------------------------
            // FIND DECKS
            // ------------------------------------------

            let matchingDeck =
                null;


            if (
                Array.isArray(
                    setData.decks
                )
            ) {

                matchingDeck =
                    setData.decks.find(
                        deck => {

                            const name =
                                String(
                                    deck.name ||
                                    ""
                                ).toLowerCase();


                            return (
                                name ===
                                prebuilt.deckName.toLowerCase()
                            );

                        }
                    );

            }


            // ------------------------------------------
            // FALLBACK:
            // SEARCH ALL DECK NAMES
            // ------------------------------------------

            if (!matchingDeck) {

                if (
                    Array.isArray(
                        setData.decks
                    )
                ) {

                    matchingDeck =
                        setData.decks.find(
                            deck => {

                                const name =
                                    String(
                                        deck.name ||
                                        ""
                                    ).toLowerCase();


                                return name.includes(
                                    prebuilt.deckName
                                        .toLowerCase()
                                );

                            }
                        );

                }

            }


            if (!matchingDeck) {

                return res.status(404).json({

                    error:
                        "Deck was not found in MTGJSON.",

                    requested:
                        prebuilt.deckName,

                    set:
                        prebuilt.setCode

                });

            }


            // ------------------------------------------
            // CONVERT CARDS
            // ------------------------------------------

            const cards = [];


            if (
                Array.isArray(
                    matchingDeck.mainBoard
                )
            ) {

                matchingDeck.mainBoard.forEach(
                    entry => {

                        cards.push({

                            id:
                                entry.uuid ||
                                entry.identifiers?.scryfallId ||
                                crypto.randomUUID(),

                            name:
                                entry.name,

                            amount:
                                Number(
                                    entry.count ||
                                    1
                                ),

                            image:
                                "",

                            scryfallId:
                                entry.identifiers?.scryfallId ||
                                null

                        });

                    }
                );

            }


            // ------------------------------------------
            // SIDEBOARD
            // ------------------------------------------

            if (
                Array.isArray(
                    matchingDeck.sideBoard
                )
            ) {

                matchingDeck.sideBoard.forEach(
                    entry => {

                        cards.push({

                            id:
                                entry.uuid ||
                                entry.identifiers?.scryfallId ||
                                crypto.randomUUID(),

                            name:
                                entry.name,

                            amount:
                                Number(
                                    entry.count ||
                                    1
                                ),

                            image:
                                "",

                            scryfallId:
                                entry.identifiers?.scryfallId ||
                                null

                        });

                    }
                );

            }


            // ------------------------------------------
            // RESPONSE
            // ------------------------------------------

            const result = {

                id:
                    prebuilt.id,

                name:
                    prebuilt.name,

                difficulty:
                    prebuilt.difficulty,

                color:
                    prebuilt.color,

                source:
                    "MTGJSON",

                cards:
                    cards

            };


            // ------------------------------------------
            // CACHE RESULT
            // ------------------------------------------

            prebuiltCache.set(
                id,
                result
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
);


// ======================================================
// START SERVER
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
```
