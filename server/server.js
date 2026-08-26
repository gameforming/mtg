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
                "Scryfall error:",
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
