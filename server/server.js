import express from "express";

const app = express();

const PORT =
    process.env.PORT || 10000;


// ======================================================
// EXTERNAL APIS
// ======================================================

const SCRYFALL_API =
    "https://api.scryfall.com";

const MTGJSON_API =
    "https://mtgjson.com/api/v5";


// ======================================================
// SETTINGS
// ======================================================

// Scryfall collection requests in batches.
const SCRYFALL_BATCH_SIZE = 75;


// ======================================================
// CORS
// ======================================================

app.use(
    (req, res, next) => {

        res.setHeader(
            "Access-Control-Allow-Origin",
            "*"
        );

        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS"
        );

        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type"
        );


        if (
            req.method === "OPTIONS"
        ) {

            return res.sendStatus(
                204
            );

        }


        next();

    }
);


app.use(
    express.json({
        limit: "2mb"
    })
);


// ======================================================
// HELPERS
// ======================================================

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


function getScryfallHeaders() {

    return {

        "Accept":
            "application/json",

        "User-Agent":
            "MTG-Game/1.0"

    };

}


function getCardImage(card) {

    // Normal card

    if (
        card.image_uris?.normal
    ) {

        return card
            .image_uris
            .normal;

    }


    // Double faced card

    if (
        Array.isArray(
            card.card_faces
        )
    ) {

        for (
            const face
            of card.card_faces
        ) {

            if (
                face.image_uris?.normal
            ) {

                return face
                    .image_uris
                    .normal;

            }

        }

    }


    return null;

}


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.json({

            online: true,

            service:
                "MTG Render Proxy",

            routes: [

                "/api/cards/search?q=dragon",

                "/api/cards/:id",

                "/api/cards/image?url=...",

                "/api/prebuilt-decks/:deckName"

            ]

        });

    }
);


// ======================================================
// SCRYFALL CARD SEARCH
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

                return res
                    .status(400)
                    .json({

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

                        headers:
                            getScryfallHeaders()

                    }
                );


            const data =
                await response.json();


            return res
                .status(
                    response.status
                )
                .json(
                    data
                );

        }

        catch (error) {

            console.error(
                "Scryfall search error:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Could not search cards."

                });

        }

    }
);


// ======================================================
// SINGLE CARD
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

                        headers:
                            getScryfallHeaders()

                    }
                );


            const data =
                await response.json();


            return res
                .status(
                    response.status
                )
                .json(
                    data
                );

        }

        catch (error) {

            console.error(
                "Card error:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Could not load card."

                });

        }

    }
);


// ======================================================
// IMAGE PROXY
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

                return res
                    .status(400)
                    .json({

                        error:
                            "Missing image URL."

                    });

            }


            const parsed =
                new URL(
                    imageUrl
                );


            // Only allow Scryfall image URLs

            const allowed =
                parsed.hostname ===
                    "cards.scryfall.io" ||

                parsed.hostname.endsWith(
                    ".scryfall.io"
                );


            if (!allowed) {

                return res
                    .status(403)
                    .json({

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
                                "MTG-Game/1.0"

                        }

                    }
                );


            if (!response.ok) {

                return res
                    .status(
                        response.status
                    )
                    .send(
                        "Image unavailable."
                    );

            }


            const contentType =
                response.headers.get(
                    "content-type"
                );


            if (contentType) {

                res.setHeader(
                    "Content-Type",
                    contentType
                );

            }


            res.setHeader(
                "Cache-Control",
                "public, max-age=86400"
            );


            const buffer =
                Buffer.from(
                    await response.arrayBuffer()
                );


            return res.send(
                buffer
            );

        }

        catch (error) {

            console.error(
                "Image proxy error:",
                error
            );


            return res
                .status(500)
                .send(
                    "Could not load image."
                );

        }

    }
);


// ======================================================
// NORMALIZE MTGJSON CARD
// ======================================================

function normalizeDeckCard(card) {

    return {

        name:
            card.name ||
            "Unknown Card",

        setCode:
            card.setCode ||
            card.set_code ||
            null,

        collectorNumber:
            card.number ||
            card.collectorNumber ||
            null,

        scryfallId:
            card.scryfallId ||
            null,

        mtgjsonId:
            card.uuid ||
            card.mtgjson_uuid ||
            null,

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
// SCRYFALL IDENTIFIER
// ======================================================

function createScryfallIdentifier(
    card
) {

    // Best option

    if (
        card.scryfallId
    ) {

        return {

            id:
                card.scryfallId

        };

    }


    // Exact printing

    if (
        card.setCode &&
        card.collectorNumber
    ) {

        return {

            set:
                String(
                    card.setCode
                ).toLowerCase(),

            collector_number:
                String(
                    card.collectorNumber
                )

        };

    }


    // Fallback

    return {

        name:
            card.name

    };

}


// ======================================================
// ENRICH CARDS WITH SCRYFALL
// ======================================================

async function enrichCardsWithScryfall(
    cards
) {

    const finalCards = [];


    for (
        let index = 0;
        index < cards.length;
        index += SCRYFALL_BATCH_SIZE
    ) {

        const batch =
            cards.slice(
                index,
                index +
                SCRYFALL_BATCH_SIZE
            );


        const identifiers =
            batch.map(
                createScryfallIdentifier
            );


        try {

            console.log(
                "Scryfall batch:",
                index,
                "-",
                index + batch.length
            );


            const response =
                await fetch(
                    `${SCRYFALL_API}/cards/collection`,
                    {

                        method:
                            "POST",

                        headers: {

                            ...getScryfallHeaders(),

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                identifiers

                            })

                    }
                );


            if (!response.ok) {

                console.error(
                    "Scryfall collection failed:",
                    response.status
                );


                finalCards.push(
                    ...batch
                );

                continue;

            }


            const data =
                await response.json();


            const returned =
                data.data || [];


            // Create maps

            const cardsById =
                new Map();


            const cardsByName =
                new Map();


            for (
                const card
                of returned
            ) {

                if (card.id) {

                    cardsById.set(
                        card.id,
                        card
                    );

                }


                if (card.name) {

                    const key =
                        card.name
                            .toLowerCase();


                    if (
                        !cardsByName.has(
                            key
                        )
                    ) {

                        cardsByName.set(
                            key,
                            card
                        );

                    }

                }

            }


            // Enrich every original card

            for (
                const original
                of batch
            ) {

                let scryfallCard =
                    null;


                if (
                    original.scryfallId
                ) {

                    scryfallCard =
                        cardsById.get(
                            original.scryfallId
                        );

                }


                if (
                    !scryfallCard &&
                    original.name
                ) {

                    scryfallCard =
                        cardsByName.get(
                            original.name
                                .toLowerCase()
                        );

                }


                // Card not found

                if (!scryfallCard) {

                    finalCards.push({

                        ...original,

                        id:
                            original.scryfallId ||
                            original.mtgjsonId ||
                            original.name

                    });

                    continue;

                }


                finalCards.push({

                    ...original,

                    id:
                        scryfallCard.id,

                    scryfallId:
                        scryfallCard.id,

                    name:
                        scryfallCard.name,

                    image:
                        getCardImage(
                            scryfallCard
                        ),

                    manaCost:
                        scryfallCard.mana_cost ||
                        "",

                    cmc:
                        scryfallCard.cmc ?? 0,

                    typeLine:
                        scryfallCard.type_line ||
                        "",

                    oracleText:
                        scryfallCard.oracle_text ||
                        "",

                    power:
                        scryfallCard.power ??
                        null,

                    toughness:
                        scryfallCard.toughness ??
                        null,

                    colors:
                        scryfallCard.colors ||
                        [],

                    colorIdentity:
                        scryfallCard.color_identity ||
                        [],

                    rarity:
                        scryfallCard.rarity ||
                        null,

                    layout:
                        scryfallCard.layout ||
                        null

                });

            }

        }

        catch (error) {

            console.error(
                "Scryfall enrichment error:",
                error
            );


            // Don't destroy the whole deck

            finalCards.push(
                ...batch
            );

        }


        // Avoid hammering API

        if (
            index +
            SCRYFALL_BATCH_SIZE <
            cards.length
        ) {

            await sleep(
                150
            );

        }

    }


    return finalCards;

}


// ======================================================
// LOAD MTGJSON DECK LIST
// ======================================================

async function loadDeckList() {

    const response =
        await fetch(
            `${MTGJSON_API}/DeckList.json`
        );


    if (!response.ok) {

        throw new Error(
            `MTGJSON DeckList failed: ${response.status}`
        );

    }


    const json =
        await response.json();


    return json.data || [];

}


// ======================================================
// FIND PREBUILT DECK
// ======================================================

function findDeck(
    deckList,
    requestedName
) {

    const normalized =
        requestedName
            .trim()
            .toLowerCase();


    return deckList.find(
        deck => {

            const name =
                String(
                    deck.name || ""
                )
                    .trim()
                    .toLowerCase();


            return (
                name === normalized
            );

        }
    );

}


// ======================================================
// LOAD PREBUILT DECK
// ======================================================

app.get(
    "/api/prebuilt-decks/:deckName",
    async (req, res) => {

        try {

            const requestedName =
                decodeURIComponent(
                    req.params.deckName
                );


            console.log(
                "Requested prebuilt deck:",
                requestedName
            );


            // ==================================================
            // 1. Load deck list from MTGJSON
            // ==================================================

            const deckList =
                await loadDeckList();


            console.log(
                "MTGJSON decks:",
                deckList.length
            );


            // ==================================================
            // 2. Find requested deck
            // ==================================================

            const deckInfo =
                findDeck(
                    deckList,
                    requestedName
                );


            if (!deckInfo) {

                console.log(
                    "Deck not found:",
                    requestedName
                );


                return res
                    .status(404)
                    .json({

                        error:
                            "Deck not found",

                        requested:
                            requestedName

                    });

            }


            console.log(
                "Found deck:",
                deckInfo.name
            );


            // ==================================================
            // 3. Determine file URL
            // ==================================================

            let deckFile =
                deckInfo.fileName ||
                deckInfo.filename ||
                deckInfo.code;


            if (!deckFile) {

                return res
                    .status(500)
                    .json({

                        error:
                            "Deck has no MTGJSON file reference.",

                        deck:
                            deckInfo

                    });

            }


            // MTGJSON filenames normally need .json

            if (
                !deckFile.endsWith(
                    ".json"
                )
            ) {

                deckFile +=
                    ".json";

            }


            const deckUrl =
                `${MTGJSON_API}/${deckFile}`;


            console.log(
                "Loading deck file:",
                deckUrl
            );


            // ==================================================
            // 4. Download deck
            // ==================================================

            const deckResponse =
                await fetch(
                    deckUrl
                );


            if (
                !deckResponse.ok
            ) {

                return res
                    .status(
                        deckResponse.status
                    )
                    .json({

                        error:
                            "Could not download MTGJSON deck.",

                        url:
                            deckUrl

                    });

            }


            const deckJson =
                await deckResponse.json();


            const sourceDeck =
                deckJson.data ||
                deckJson;


            // ==================================================
            // 5. Get cards
            // ==================================================

            const sourceCards =
                sourceDeck.cards ||
                sourceDeck.mainBoard ||
                sourceDeck.mainboard ||
                [];


            const cards =
                sourceCards.map(
                    normalizeDeckCard
                );


            if (
                cards.length === 0
            ) {

                console.log(
                    "Deck contained no cards."
                );


                return res
                    .status(500)
                    .json({

                        error:
                            "Deck contains no cards."

                    });

            }


            console.log(
                "Deck cards:",
                cards.length
            );


            // ==================================================
            // 6. Enrich through Scryfall
            // ==================================================

            const enrichedCards =
                await enrichCardsWithScryfall(
                    cards
                );


            // ==================================================
            // 7. Send deck to frontend
            // ==================================================

            return res.json({

                source:
                    "MTGJSON + Scryfall",

                id:
                    deckInfo.code ||
                    deckInfo.fileName ||
                    deckInfo.name,

                name:
                    sourceDeck.name ||
                    deckInfo.name,

                type:
                    sourceDeck.type ||
                    deckInfo.type ||
                    null,

                releaseDate:
                    sourceDeck.releaseDate ||
                    deckInfo.releaseDate ||
                    null,

                cards:
                    enrichedCards

            });

        }

        catch (error) {

            console.error(
                "Prebuilt deck error:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Could not load prebuilt deck.",

                    message:
                        error.message

                });

        }

    }
);


// ======================================================
// 404 HANDLER
// ======================================================

app.use(
    (req, res) => {

        res
            .status(404)
            .json({

                error:
                    "API route not found.",

                path:
                    req.path

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
            `MTG server running on port ${PORT}`
        );

    }
);
