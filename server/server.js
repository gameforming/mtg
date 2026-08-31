import express from "express";

const app = express();

const PORT =
    process.env.PORT || 10000;

const SCRYFALL_API =
    "https://api.scryfall.com";

const MTGJSON_API =
    "https://mtgjson.com/api/v5";


// ======================================================
// SETTINGS
// ======================================================

// Scryfall collection endpoint ondersteunt batches.
// We houden dit bewust onder een veilige grootte.
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
        resolve => {

            setTimeout(
                resolve,
                ms
            );

        }
    );

}


function getCardImage(
    card
) {

    if (
        card.image_uris?.normal
    ) {

        return card
            .image_uris
            .normal;

    }


    if (
        card.card_faces
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

            online:
                true,

            service:
                "MTG Scryfall + MTGJSON Proxy"

        });

    }
);


// ======================================================
// SCRYFALL SEARCH
// ======================================================

app.get(
    "/api/cards/search",
    async (
        req,
        res
    ) => {

        try {

            const query =
                String(
                    req.query.q || ""
                ).trim();


            if (
                !query
            ) {

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


            if (
                !response.ok
            ) {

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

        catch (
            error
        ) {

            console.error(
                "Scryfall search error:",
                error
            );


            res
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
    async (
        req,
        res
    ) => {

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


            if (
                !response.ok
            ) {

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

        catch (
            error
        ) {

            console.error(
                "Single card error:",
                error
            );


            res
                .status(500)
                .json({

                    error:
                        "Could not get card."

                });

        }

    }
);


// ======================================================
// CARD IMAGE PROXY
// ======================================================

app.get(
    "/api/cards/image",
    async (
        req,
        res
    ) => {

        try {

            const imageUrl =
                String(
                    req.query.url || ""
                ).trim();


            if (
                !imageUrl
            ) {

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


            // Alleen Scryfall images toestaan.
            // Dit voorkomt dat jouw proxy gebruikt
            // wordt om willekeurige websites op te halen.

            if (
                !parsed.hostname.endsWith(
                    ".scryfall.io"
                ) &&
                parsed.hostname !==
                "cards.scryfall.io"
            ) {

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


            if (
                !response.ok
            ) {

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


            if (
                contentType
            ) {

                res.setHeader(
                    "Content-Type",
                    contentType
                );

            }


            // Browser mag afbeelding cachen.
            res.setHeader(
                "Cache-Control",
                "public, max-age=86400"
            );


            const imageBuffer =
                Buffer.from(
                    await response.arrayBuffer()
                );


            res.send(
                imageBuffer
            );

        }

        catch (
            error
        ) {

            console.error(
                "Image proxy error:",
                error
            );


            res
                .status(500)
                .send(
                    "Could not load image."
                );

        }

    }
);


// ======================================================
// MTGJSON DECK LIST
// ======================================================

app.get(
    "/api/decks",
    async (
        req,
        res
    ) => {

        try {

            const response =
                await fetch(
                    `${MTGJSON_API}/SetList.json`
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Could not load MTGJSON set list."
                );

            }


            const data =
                await response.json();


            res.json(
                data
            );

        }

        catch (
            error
        ) {

            console.error(
                "MTGJSON error:",
                error
            );


            res
                .status(500)
                .json({

                    error:
                        "Could not load decks."

                });

        }

    }
);


// ======================================================
// CONVERT MTGJSON CARD
// ======================================================

function convertCard(
    card
) {

    return {

        // Gebruik Scryfall ID als die bestaat.
        // Anders gebruiken we tijdelijk UUID/naam.

        id:
            card.scryfallId ||
            card.uuid ||
            card.name,

        scryfallId:
            card.scryfallId ||
            null,

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
// BUILD SCRYFALL IDENTIFIER
// ======================================================

function buildIdentifier(
    card
) {

    // Beste methode:
    // exacte Scryfall UUID.

    if (
        card.scryfallId
    ) {

        return {

            id:
                card.scryfallId

        };

    }


    // Tweede keuze:
    // exacte set + collector number.

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


    // Laatste fallback:
    // kaartnaam.

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

    const finalCards =
        [];


    for (
        let start = 0;
        start < cards.length;
        start += SCRYFALL_BATCH_SIZE
    ) {

        const batch =
            cards.slice(
                start,
                start +
                SCRYFALL_BATCH_SIZE
            );


        const identifiers =
            batch.map(
                buildIdentifier
            );


        try {

            const response =
                await fetch(
                    `${SCRYFALL_API}/cards/collection`,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "User-Agent":
                                "MTG-Game/1.0"

                        },

                        body:
                            JSON.stringify({

                                identifiers

                            })

                    }
                );


            if (
                !response.ok
            ) {

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


            const returnedCards =
                data.data || [];


            const notFound =
                data.not_found || [];


            // Maak een map voor snelle matching.

            const byId =
                new Map();


            const byName =
                new Map();


            for (
                const scryfallCard
                of returnedCards
            ) {

                byId.set(
                    scryfallCard.id,
                    scryfallCard
                );


                if (
                    scryfallCard.name
                ) {

                    byName.set(
                        scryfallCard.name
                            .toLowerCase(),
                        scryfallCard
                    );

                }

            }


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
                        byId.get(
                            original.scryfallId
                        );

                }


                if (
                    !scryfallCard &&
                    original.name
                ) {

                    scryfallCard =
                        byName.get(
                            original.name
                                .toLowerCase()
                        );

                }


                if (
                    !scryfallCard
                ) {

                    finalCards.push(
                        original
                    );

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
                        scryfallCard.cmc ??
                        0,

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


            // Kleine pauze tussen batches.
            if (
                start +
                SCRYFALL_BATCH_SIZE <
                cards.length
            ) {

                await sleep(
                    150
                );

            }

        }

        catch (
            error
        ) {

            console.error(
                "Card enrichment error:",
                error
            );


            // De deck blijft bruikbaar,
            // ook als Scryfall tijdelijk faalt.

            finalCards.push(
                ...batch
            );

        }

    }


    return finalCards;

}


// ======================================================
// CONVERT MTGJSON DECK
// ======================================================

async function convertDeck(
    sourceDeck,
    deckInfo = {}
) {

    const sourceCards =
        sourceDeck.cards ||
        sourceDeck.mainBoard ||
        sourceDeck.mainboard ||
        [];


    const cards =
        sourceCards.map(
            convertCard
        );


    const enrichedCards =
        await enrichCardsWithScryfall(
            cards
        );


    return {

        source:
            "MTGJSON + Scryfall",

        name:
            sourceDeck.name ||
            deckInfo.name ||
            "Unknown Deck",

        code:
            sourceDeck.code ||
            deckInfo.code ||
            null,

        fileName:
            deckInfo.fileName ||
            null,

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

    };

}


// ======================================================
// LOAD SPECIFIC PREBUILT DECK
// ======================================================
//
// Dit endpoint verwacht bijvoorbeeld:
//
// /api/decks/abc.json
//
// Of jouw frontend kan hier de bestaande
// deck endpoint-naam voor gebruiken.
// ======================================================

app.get(
    "/api/deck/:fileName",
    async (
        req,
        res
    ) => {

        try {

            const fileName =
                encodeURIComponent(
                    req.params.fileName
                );


            const url =
                `${MTGJSON_API}/DeckList.json`;


            const response =
                await fetch(
                    url
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Could not load MTGJSON DeckList."
                );

            }


            const deckList =
                await response.json();


            const list =
                deckList.data ||
                [];


            const deckInfo =
                list.find(
                    deck =>

                        deck.fileName ===
                        req.params.fileName ||

                        deck.code ===
                        req.params.fileName ||

                        deck.name ===
                        req.params.fileName
                );


            if (
                !deckInfo
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Deck not found."

                    });

            }


            const actualFile =
                deckInfo.fileName ||
                fileName;


            const deckResponse =
                await fetch(
                    `${MTGJSON_API}/${actualFile}`
                );


            if (
                !deckResponse.ok
            ) {

                throw new Error(
                    "Could not load deck file."
                );

            }


            const deckData =
                await deckResponse.json();


            const sourceDeck =
                deckData.data ||
                deckData;


            const result =
                await convertDeck(
                    sourceDeck,
                    deckInfo
                );


            res.json(
                result
            );

        }

        catch (
            error
        ) {

            console.error(
                "Deck loading error:",
                error
            );


            res
                .status(500)
                .json({

                    error:
                        "Could not load prebuilt deck."

                });

        }

    }
);


// ======================================================
// 404
// ======================================================

app.use(
    (
        req,
        res
    ) => {

        res
            .status(404)
            .json({

                error:
                    "API route not found."

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
