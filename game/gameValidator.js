// ======================================================
// DECK VALIDATOR
// ======================================================


function validateDeck(deck, mode) {

    const errors = [];

    if (!deck) {

        return {

            valid: false,

            errors: [
                "No deck selected."
            ]

        };

    }


    if (!mode) {

        return {

            valid: false,

            errors: [
                "No game mode selected."
            ]

        };

    }


    // ==================================================
    // COUNT CARDS
    // ==================================================

    const totalCards =
        deck.cards.reduce(
            (total, card) =>
                total + card.amount,
            0
        );


    // ==================================================
    // MINIMUM
    // ==================================================

    if (
        totalCards <
        mode.deck.minimumCards
    ) {

        errors.push(
            `Needs at least ${mode.deck.minimumCards} cards.`
        );

    }


    // ==================================================
    // MAXIMUM
    // ==================================================

    if (
        mode.deck.maximumCards !== null &&
        totalCards >
        mode.deck.maximumCards
    ) {

        errors.push(
            `Cannot contain more than ${mode.deck.maximumCards} cards.`
        );

    }


    // ==================================================
    // COPY LIMIT
    // ==================================================

    if (
        mode.deck.maxCopies !== null
    ) {

        deck.cards.forEach(card => {

            if (
                card.amount >
                mode.deck.maxCopies
            ) {

                errors.push(
                    `${card.name}: maximum ${mode.deck.maxCopies} copies.`
                );

            }

        });

    }


    // ==================================================
    // RESULT
    // ==================================================

    return {

        valid:
            errors.length === 0,

        errors,

        totalCards

    };

}


// ======================================================
// GET DECK STATUS
// ======================================================

function getDeckStatus(
    deck,
    mode
) {

    const result =
        validateDeck(
            deck,
            mode
        );


    if (result.valid) {

        return {

            valid: true,

            text: "Suitable"

        };

    }


    return {

        valid: false,

        text: result.errors[0]

    };

}
