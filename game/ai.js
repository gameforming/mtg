// ======================================================
// MTG AI
// ======================================================

function runAI() {

    if (
        !currentGame
    ) {

        return;

    }


    if (
        currentGame.status !==
        "playing"
    ) {

        return;

    }


    if (
        currentGame.activePlayer !==
        1
    ) {

        return;

    }


    logGame(
        "AI is thinking..."
    );


    setTimeout(
        aiMainPhase,
        500
    );

}


// ======================================================
// AI MAIN PHASE
// ======================================================

function aiMainPhase() {

    const ai =
        currentGame.players[1];


    // ==============================================
    // PLAY LAND
    // ==============================================

    aiPlayLand();


    // ==============================================
    // MAKE MANA
    // ==============================================

    aiGenerateMana();


    // ==============================================
    // CAST CARDS
    // ==============================================

    aiCastCards();


    renderGame();


    // ==============================================
    // COMBAT
    // ==============================================

    setTimeout(
        aiCombat,
        700
    );

}


// ======================================================
// AI PLAY LAND
// ======================================================

function aiPlayLand() {

    const ai =
        currentGame.players[1];


    if (
        ai.landsPlayed >= 1
    ) {

        return;

    }


    const lands =
        ai.hand.filter(
            card =>
                isLand(card)
        );


    if (
        lands.length === 0
    ) {

        return;

    }


    // Prefer basic lands
    const land =
        lands.find(
            card =>
                [
                    "Plains",
                    "Island",
                    "Swamp",
                    "Mountain",
                    "Forest"
                ].includes(
                    card.name
                )
        ) || lands[0];


    playLand(
        1,
        land.instanceId
    );

}


// ======================================================
// AI GENERATE MANA
// ======================================================

function aiGenerateMana() {

    const ai =
        currentGame.players[1];


    ai.battlefield
        .filter(
            card =>
                isLand(card) &&
                !card.tapped
        )
        .forEach(
            card => {

                tapLand(
                    1,
                    card.instanceId
                );

            }
        );

}


// ======================================================
// AI CAST CARDS
// ======================================================

function aiCastCards() {

    const ai =
        currentGame.players[1];


    let safety =
        20;


    while (
        safety > 0
    ) {

        safety--;


        const playable =
            ai.hand
                .filter(
                    card =>
                        !isLand(card)
                )
                .filter(
                    card =>
                        canPayMana(
                            ai,
                            parseManaCost(
                                card.manaCost
                            )
                        )
                );


        if (
            playable.length === 0
        ) {

            break;

        }


        // Prefer creatures
        // and then highest mana cost.

        playable.sort(
            (a, b) => {

                const aCreature =
                    isCreature(a)
                        ? 1
                        : 0;


                const bCreature =
                    isCreature(b)
                        ? 1
                        : 0;


                if (
                    aCreature !==
                    bCreature
                ) {

                    return (
                        bCreature -
                        aCreature
                    );

                }


                return (
                    manaValue(b) -
                    manaValue(a)
                );

            }
        );


        const card =
            playable[0];


        const success =
            castCard(
                1,
                card.instanceId
            );


        if (!success) {

            break;

        }

    }

}


// ======================================================
// AI COMBAT
// ======================================================

function aiCombat() {

    if (
        currentGame.status !==
        "playing"
    ) {

        return;

    }


    if (
        currentGame.activePlayer !==
        1
    ) {

        return;

    }


    currentGame.phase =
        "combat";


    startCombat();


    const ai =
        currentGame.players[1];


    const attackers =
        ai.battlefield.filter(
            card =>
                isCreature(card) &&
                !card.tapped &&
                !card.summoningSickness
        );


    // Simple AI:
    // attack with creatures that
    // are at least 1 power.

    attackers.forEach(
        card => {

            if (
                getPower(card) > 0
            ) {

                card.attacking =
                    true;


                currentGame.combat
                    .attackers
                    .push(
                        card.instanceId
                    );

            }

        }
    );


    aiResolveCombat();


}


// ======================================================
// AI COMBAT RESOLUTION
// ======================================================

function aiResolveCombat() {

    const ai =
        currentGame.players[1];


    const player =
        currentGame.players[0];


    const attackers =
        ai.battlefield.filter(
            card =>
                card.attacking
        );


    const blockers =
        player.battlefield.filter(
            card =>
                isCreature(card) &&
                !card.tapped &&
                !card.summoningSickness
        );


    attackers.forEach(
        attacker => {

            attacker.tapped = true;


            // Find a useful blocker.
            const blocker =
                blockers.find(
                    candidate =>
                        getPower(candidate) >=
                        getPower(attacker)
                );


            if (!blocker) {

                dealDamage(
                    0,
                    getPower(attacker)
                );


                return;

            }


            blocker.tapped =
                false;


            blocker.damage +=
                getPower(attacker);


            attacker.damage +=
                getPower(blocker);


            blockers.splice(
                blockers.indexOf(
                    blocker
                ),
                1
            );

        }
    );


    checkCreatureDeath(0);

    checkCreatureDeath(1);


    attackers.forEach(
        attacker => {

            attacker.attacking =
                false;

        }
    );


    currentGame.phase =
        "main2";


    renderGame();


    setTimeout(
        () => {

            endTurn();

        },
        700
    );

}


// ======================================================
// MANA VALUE
// ======================================================

function manaValue(card) {

    const cost =
        parseManaCost(
            card.manaCost
        );


    return (
        cost.generic +
        cost.white +
        cost.blue +
        cost.black +
        cost.red +
        cost.green +
        cost.colorless
    );

}
