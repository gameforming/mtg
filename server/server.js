import express from "express";

const app = express();

const PORT = process.env.PORT || 10000;

const SCRYFALL_API =
    "https://api.scryfall.com";


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

    next();

});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.json({
            online: true,
            service: "MTG Scryfall Proxy"
        });

    }
);


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
// IMPORTANT:
// THIS MUST COME BEFORE /api/cards/:id
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


            // ------------------------------------------
            // CHECK URL
            // ------------------------------------------

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


            // ------------------------------------------
            // ONLY ALLOW SCRYFALL IMAGES
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


            // ------------------------------------------
            // FETCH IMAGE
            // ------------------------------------------

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
                    .status(response.status)
                    .send(
                        "Image unavailable"
                    );

            }


            // ------------------------------------------
            // CONTENT TYPE
            // ------------------------------------------

            const contentType =
                response.headers.get(
                    "content-type"
                );


            res.setHeader(
                "Content-Type",
                contentType ||
                "image/jpeg"
            );


            // ------------------------------------------
            // CACHE
            // ------------------------------------------

            res.setHeader(
                "Cache-Control",
                "public, max-age=86400"
            );


            // ------------------------------------------
            // SEND IMAGE
            // ------------------------------------------

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
// IMPORTANT:
// THIS MUST COME AFTER /api/cards/image
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
