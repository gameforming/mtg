function validateDeck(deck, mode) {

    const errors = [];

    const totalCards =
        deck.cards.reduce(
            (total, card) =>
                total + card.amount,
            0
        );


    if (
        totalCards <
        mode.deck.minimumCards
    ) {

        errors.push(
            `Deck needs at least ${mode.deck.minimumCards} cards.`
        );

    }


    if (
        mode.deck.maximumCards !== null &&
        totalCards >
        mode.deck.maximumCards
    ) {

        errors.push(
            `Deck cannot contain more than ${mode.deck.maximumCards} cards.`
        );

    }


    for (const card of deck.cards) {

        if (
            card.amount >
            mode.deck.maxCopies
        ) {

            errors.push(
                `${card.name}: too many copies.`
            );

        }

    }


    return {

        valid: errors.length === 0,

        errors

    };

}
