// ======================================================
// MTG GAME ENGINE
// ======================================================

let currentGame = null;


// ======================================================
// START GAME
// ======================================================

async function startGameEngine(
    mode,
    playerDeck,
    opponentDeck
) {

    console.log("Starting MTG game...");


    const playerLibrary =
        prepareDeck(playerDeck);


    const opponentLibrary =
        prepareDeck(opponentDeck);


    console.log(
        "Loading player cards..."
    );


    await loadCardData(
        playerLibrary
    );


    console.log(
        "Loading opponent cards..."
    );


    await loadCardData(
        opponentLibrary
    );


    currentGame =
        createGameState(
            mode,
            playerLibrary,
            opponentLibrary
        );


    shuffle(
        currentGame.players[0].library
    );


    shuffle(
        currentGame.players[1].library
    );


    drawCards(
        0,
        mode?.rules?.startingHand || 7
    );


    drawCards(
        1,
        mode?.rules?.startingHand || 7
    );


    currentGame.status =
        "mulligan";


    logGame(
        "Both players drew their opening hands."
    );


    renderGame();

}


// ======================================================
// PREPARE DECK
// ======================================================

function prepareDeck(deck) {

    const cards = [];


    if (!deck || !deck.cards) {

        console.error(
            "Invalid deck:",
            deck
        );

        return cards;

    }


    deck.cards.forEach(card => {

        const amount =
            Number(card.amount) || 0;


        for (
            let i = 0;
            i < amount;
            i++
        ) {

            cards.push({

                id: card.id,

                name: card.name,

                image:
                    card.image ||
                    "",

                instanceId:
                    crypto.randomUUID(),

                tapped: false,

                summoningSickness: true,

                attacking: false,

                blocking: false,

                blockingTarget: null,

                damage: 0,

                typeLine: "",

                oracleText: "",

                manaCost: "",

                power: null,

                toughness: null,

                colors: [],

                types: [],

                subtypes: []

            });

        }

    });


    return cards;

}


// ======================================================
// LOAD CARD DATA
// ======================================================

async function loadCardData(
    cards
) {

    const cache = {};


    for (const card of cards) {

        if (cache[card.id]) {

            Object.assign(
                card,
                cache[card.id]
            );

            continue;

        }


        try {

            const response =
                await fetch(
                    `https://api.scryfall.com/cards/${card.id}`
                );


            if (!response.ok) {

                console.warn(
                    "Scryfall failed:",
                    card.name
                );

                continue;

            }


            const data =
                await response.json();


            const parsed = {

                typeLine:
                    data.type_line || "",

                oracleText:
                    data.oracle_text || "",

                manaCost:
                    data.mana_cost || "",

                power:
                    data.power !== undefined
                        ? Number(data.power)
                        : null,

                toughness:
                    data.toughness !== undefined
                        ? Number(data.toughness)
                        : null,

                colors:
                    data.colors || [],

                types:
                    getCardTypes(
                        data.type_line || ""
                    ),

                subtypes:
                    getCardSubtypes(
                        data.type_line || ""
                    )

            };


            cache[card.id] =
                parsed;


            Object.assign(
                card,
                parsed
            );


        } catch (error) {

            console.error(
                "Card loading error:",
                card.name,
                error
            );

        }

    }

}


// ======================================================
// CARD TYPES
// ======================================================

function getCardTypes(
    typeLine
) {

    const beforeDash =
        typeLine
            .split("—")[0]
            .trim();


    if (!beforeDash) {

        return [];

    }


    return beforeDash
        .split(/\s+/);

}


function getCardSubtypes(
    typeLine
) {

    if (
        !typeLine.includes("—")
    ) {

        return [];

    }


    return typeLine
        .split("—")[1]
        .trim()
        .split(/\s+/);

}


// ======================================================
// SHUFFLE
// ======================================================

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}


// ======================================================
// DRAW
// ======================================================

function drawCard(
    playerId
) {

    const player =
        currentGame.players[playerId];


    if (
        player.library.length === 0
    ) {

        loseGame(
            playerId,
            "Your library is empty."
        );

        return null;

    }


    const card =
        player.library.pop();


    player.hand.push(card);


    logGame(
        `${player.name} drew ${card.name}.`
    );


    return card;

}


function drawCards(
    playerId,
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        if (
            currentGame.status ===
            "finished"
        ) {

            return;

        }


        drawCard(
            playerId
        );

    }

}


// ======================================================
// MULLIGAN
// ======================================================

function mulliganOpeningHand(
    playerId
) {

    if (
        currentGame.status !==
        "mulligan"
    ) {

        return;

    }


    const player =
        currentGame.players[playerId];


    if (
        player.handKept
    ) {

        return;

    }


    player.library.push(
        ...player.hand
    );


    player.hand = [];


    shuffle(
        player.library
    );


    const newHandSize =
        Math.max(
            0,
            (currentGame.modeData.rules?.startingHand || 7)
            - player.mulligans
            - 1
        );


    drawCards(
        playerId,
        newHandSize
    );


    player.mulligans++;


    renderGame();

}


// ======================================================
// KEEP HAND
// ======================================================

function keepOpeningHand(
    playerId
) {

    if (
        currentGame.status !==
        "mulligan"
    ) {

        return;

    }


    const player =
        currentGame.players[playerId];


    player.handKept = true;


    logGame(
        `${player.name} kept their hand.`
    );


    checkMulliganFinished();

}


// ======================================================
// MULLIGAN FINISHED
// ======================================================

function checkMulliganFinished() {

    const ready =
        currentGame.players.every(
            player =>
                player.handKept
        );


    if (!ready) {

        renderGame();

        return;

    }


    startFirstTurn();

}


// ======================================================
// FIRST TURN
// ======================================================

function startFirstTurn() {

    currentGame.status =
        "playing";


    currentGame.turn = 1;


    currentGame.activePlayer = 0;


    currentGame.priorityPlayer = 0;


    currentGame.firstTurn = true;


    beginTurn();

}


// ======================================================
// BEGIN TURN
// ======================================================

function beginTurn() {

    if (
        currentGame.status ===
        "finished"
    ) {

        return;

    }


    const player =
        currentGame.players[
            currentGame.activePlayer
        ];


    currentGame.phase =
        "beginning";


    currentGame.step =
        "untap";


    player.landsPlayed = 0;


    resetMana(
        player.id
    );


    untapPlayer(
        player.id
    );


    player.battlefield.forEach(
        card => {

            card.summoningSickness =
                false;

            card.attacking = false;

            card.blocking = false;

            card.blockingTarget =
                null;

            card.damage = 0;

        }
    );


    currentGame.step =
        "upkeep";


    logGame(
        `${player.name}'s upkeep.`
    );


    currentGame.step =
        "draw";


    if (
        !(
            currentGame.turn === 1 &&
            player.id === 0
        )
    ) {

        drawCard(
            player.id
        );

    }


    currentGame.phase =
        "main1";


    currentGame.step =
        "main";


    currentGame.priorityPlayer =
        player.id;


    renderGame();


    if (
        player.id === 1
    ) {

        setTimeout(
            runAI,
            700
        );

    }

}


// ======================================================
// UNTAP
// ======================================================

function untapPlayer(
    playerId
) {

    const player =
        currentGame.players[playerId];


    player.battlefield.forEach(
        card => {

            card.tapped = false;

        }
    );

}


// ======================================================
// RESET MANA
// ======================================================

function resetMana(
    playerId
) {

    const mana =
        currentGame.players[playerId].mana;


    mana.white = 0;
    mana.blue = 0;
    mana.black = 0;
    mana.red = 0;
    mana.green = 0;
    mana.colorless = 0;

    mana.available = 0;
    mana.maximum = 0;

}


// ======================================================
// END TURN
// ======================================================

function endTurn() {

    if (
        currentGame.status !==
        "playing"
    ) {

        return;

    }


    currentGame.players[
        currentGame.activePlayer
    ].battlefield.forEach(
        card => {

            card.attacking = false;

            card.blocking = false;

            card.blockingTarget =
                null;

            card.damage = 0;

        }
    );


    currentGame.activePlayer =
        currentGame.activePlayer === 0
            ? 1
            : 0;


    currentGame.turn++;


    currentGame.combat = {

        attackers: [],

        blockers: [],

        damageAssigned: false,

        resolved: false

    };


    beginTurn();

}


// ======================================================
// NEXT PHASE
// ======================================================

function nextPhase() {
   

    if (!currentGame) {

        console.error(
            "Cannot go to next phase: no game is running."
        );

        return;
    if (
        currentGame.status !==
        "playing"
    ) {

        return;

    }


    if (
        currentGame.activePlayer !== 0
    ) {

        return;

    }


    switch (
        currentGame.phase
    ) {

        case "main1":

            currentGame.phase =
                "combat";

            startCombat();

            break;


        case "combat":

            resolveCombat();


            currentGame.phase =
                "main2";


            renderGame();

            break;


        case "main2":

            currentGame.phase =
                "ending";


            renderGame();


            setTimeout(
                endTurn,
                500
            );

            break;


        case "ending":

            endTurn();

            break;

    }

}


// ======================================================
// COMBAT
// ======================================================

function startCombat() {

    currentGame.combat = {

        attackers: [],

        blockers: [],

        damageAssigned: false,

        resolved: false

    };


    logGame(
        "Combat begins."
    );


    renderGame();

}


// ======================================================
// TOGGLE ATTACK
// ======================================================

function toggleAttack(
    cardInstanceId
) {

    if (
        currentGame.phase !==
        "combat"
    ) {

        return;

    }


    if (
        currentGame.activePlayer !==
        0
    ) {

        return;

    }


    const player =
        currentGame.players[0];


    const card =
        player.battlefield.find(
            c =>
                c.instanceId ===
                cardInstanceId
        );


    if (!card) {

        return;

    }


    if (
        !isCreature(card)
    ) {

        return;

    }


    if (
        card.tapped ||
        card.summoningSickness
    ) {

        return;

    }


    card.attacking =
        !card.attacking;


    if (card.attacking) {

        currentGame.combat.attackers.push(
            card.instanceId
        );

    } else {

        currentGame.combat.attackers =
            currentGame.combat.attackers.filter(
                id =>
                    id !== card.instanceId
            );

    }


    renderGame();

}


// ======================================================
// RESOLVE COMBAT
// ======================================================

function resolveCombat() {

    if (
        currentGame.phase !==
        "combat"
    ) {

        return;

    }


    const player =
        currentGame.players[0];


    const opponent =
        currentGame.players[1];


    const attackers =
        player.battlefield.filter(
            card =>
                card.attacking
        );


    if (
        attackers.length === 0
    ) {

        logGame(
            "No attackers declared."
        );


        currentGame.combat.resolved =
            true;


        renderGame();

        return;

    }


    // AI automatically blocks
    aiDeclareBlockers(
        attackers
    );


    attackers.forEach(
        attacker => {

            attacker.tapped = true;


            const blocker =
                opponent.battlefield.find(
                    card =>
                        card.blockingTarget ===
                        attacker.instanceId
                );


            if (!blocker) {

                dealDamage(
                    1,
                    getPower(attacker)
                );


                return;

            }


            const attackPower =
                getPower(attacker);


            const blockPower =
                getPower(blocker);


            attacker.damage +=
                blockPower;


            blocker.damage +=
                attackPower;

        }
    );


    checkCreatureDeath(0);

    checkCreatureDeath(1);


    currentGame.combat.resolved =
        true;


    renderGame();

}


// ======================================================
// AI BLOCKERS
// ======================================================

function aiDeclareBlockers(
    attackers
) {

    const opponent =
        currentGame.players[1];


    const availableBlockers =
        opponent.battlefield.filter(
            card =>
                isCreature(card) &&
                !card.tapped &&
                !card.summoningSickness
        );


    attackers.forEach(
        attacker => {

            const blocker =
                availableBlockers.find(
                    candidate =>
                        getPower(candidate) >=
                        getPower(attacker)
                );


            if (!blocker) {

                return;

            }


            blocker.blocking = true;

            blocker.blockingTarget =
                attacker.instanceId;


            availableBlockers.splice(
                availableBlockers.indexOf(
                    blocker
                ),
                1
            );

        }
    );

}


// ======================================================
// DAMAGE
// ======================================================

function dealDamage(
    playerId,
    amount
) {

    const player =
        currentGame.players[playerId];


    player.life -=
        amount;


    logGame(
        `${player.name} takes ${amount} damage.`
    );


    if (
        player.life <= 0
    ) {

        loseGame(
            playerId,
            "Life reached zero."
        );

    }

}


// ======================================================
// CREATURE DEATH
// ======================================================

function checkCreatureDeath(
    playerId
) {

    const player =
        currentGame.players[playerId];


    const dead =
        player.battlefield.filter(
            card => {

                if (
                    !isCreature(card)
                ) {

                    return false;

                }


                const toughness =
                    getToughness(card);


                return (
                    card.damage >=
                    toughness
                );

            }
        );


    dead.forEach(
        card => {

            player.battlefield =
                player.battlefield.filter(
                    c =>
                        c.instanceId !==
                        card.instanceId
                );


            card.tapped = false;

            card.attacking = false;

            card.blocking = false;


            player.graveyard.push(
                card
            );


            logGame(
                `${card.name} died.`
            );

        }
    );

}


// ======================================================
// PLAY LAND
// ======================================================

function playLand(
    playerId,
    cardInstanceId
) {

    const player =
        currentGame.players[playerId];


    if (
        playerId !==
        currentGame.activePlayer
    ) {

        return false;

    }


    if (
        currentGame.phase !==
            "main1" &&
        currentGame.phase !==
            "main2"
    ) {

        return false;

    }


    if (
        player.landsPlayed >= 1
    ) {

        logGame(
            "You already played a land this turn."
        );

        return false;

    }


    const index =
        player.hand.findIndex(
            card =>
                card.instanceId ===
                cardInstanceId
        );


    if (index === -1) {

        return false;

    }


    const card =
        player.hand[index];


    if (
        !isLand(card)
    ) {

        return false;

    }


    player.hand.splice(
        index,
        1
    );


    player.battlefield.push(
        card
    );


    player.landsPlayed++;


    logGame(
        `${player.name} played ${card.name}.`
    );


    renderGame();


    return true;

}


// ======================================================
// GET LAND COLOR
// ======================================================

function getLandMana(
    card
) {

    const text =
        (
            card.oracleText ||
            ""
        ).toLowerCase();


    if (
        text.includes("{w}")
    ) {

        return "white";

    }


    if (
        text.includes("{u}")
    ) {

        return "blue";

    }


    if (
        text.includes("{b}")
    ) {

        return "black";

    }


    if (
        text.includes("{r}")
    ) {

        return "red";

    }


    if (
        text.includes("{g}")
    ) {

        return "green";

    }


    // Basic land detection

    const name =
        card.name.toLowerCase();


    if (
        name === "plains"
    ) {

        return "white";

    }


    if (
        name === "island"
    ) {

        return "blue";

    }


    if (
        name === "swamp"
    ) {

        return "black";

    }


    if (
        name === "mountain"
    ) {

        return "red";

    }


    if (
        name === "forest"
    ) {

        return "green";

    }


    return "colorless";

}


// ======================================================
// TAP LAND
// ======================================================

function tapLand(
    playerId,
    cardInstanceId
) {

    const player =
        currentGame.players[playerId];


    const card =
        player.battlefield.find(
            c =>
                c.instanceId ===
                cardInstanceId
        );


    if (!card) {

        return;

    }


    if (
        !isLand(card)
    ) {

        return;

    }


    if (
        card.tapped
    ) {

        return;

    }


    card.tapped = true;


    const color =
        getLandMana(card);


    player.mana[color]++;


    player.mana.available++;


    logGame(
        `${player.name} tapped ${card.name} for ${color} mana.`
    );


    renderGame();

}


// ======================================================
// CAST CARD
// ======================================================

function castCard(
    playerId,
    cardInstanceId
) {

    const player =
        currentGame.players[playerId];


    if (
        currentGame.activePlayer !==
        playerId
    ) {

        return false;

    }


    if (
        currentGame.phase !==
            "main1" &&
        currentGame.phase !==
            "main2"
    ) {

        return false;

    }


    const index =
        player.hand.findIndex(
            card =>
                card.instanceId ===
                cardInstanceId
        );


    if (index === -1) {

        return false;

    }


    const card =
        player.hand[index];


    if (
        isLand(card)
    ) {

        return false;

    }


    const cost =
        parseManaCost(
            card.manaCost
        );


    if (
        !canPayMana(
            player,
            cost
        )
    ) {

        logGame(
            `Not enough mana to cast ${card.name}.`
        );


        return false;

    }


    payMana(
        player,
        cost
    );


    player.hand.splice(
        index,
        1
    );


    // ==============================================
    // CREATURE
    // ==============================================

    if (
        isCreature(card)
    ) {

        card.summoningSickness =
            true;


        player.battlefield.push(
            card
        );


        logGame(
            `${player.name} cast ${card.name}.`
        );


        renderGame();


        return true;

    }


    // ==============================================
    // NONCREATURE SPELL
    // ==============================================

    if (
        isInstant(card) ||
        isSorcery(card)
    ) {

        resolveSpell(
            playerId,
            card
        );


        return true;

    }


    // Unknown permanent
    player.battlefield.push(
        card
    );


    logGame(
        `${player.name} cast ${card.name}.`
    );


    renderGame();


    return true;

}


// ======================================================
// PARSE MANA COST
// ======================================================

function parseManaCost(
    manaCost
) {

    const result = {

        generic: 0,

        white: 0,

        blue: 0,

        black: 0,

        red: 0,

        green: 0,

        colorless: 0

    };


    if (!manaCost) {

        return result;

    }


    const symbols =
        manaCost.match(
            /\{[^}]+\}/g
        ) || [];


    symbols.forEach(
        symbol => {

            const value =
                symbol
                    .replace(
                        /[{}]/g,
                        ""
                    )
                    .toUpperCase();


            if (
                /^\d+$/.test(value)
            ) {

                result.generic +=
                    Number(value);

                return;

            }


            switch (value) {

                case "W":

                    result.white++;

                    break;

                case "U":

                    result.blue++;

                    break;

                case "B":

                    result.black++;

                    break;

                case "R":

                    result.red++;

                    break;

                case "G":

                    result.green++;

                    break;

                case "C":

                    result.colorless++;

                    break;

                default:

                    // Hybrid / X / phyrexian
                    // mana will be handled later.

                    break;

            }

        }
    );


    return result;

}


// ======================================================
// TOTAL MANA
// ======================================================

function getTotalMana(
    player
) {

    return (
        player.mana.white +
        player.mana.blue +
        player.mana.black +
        player.mana.red +
        player.mana.green +
        player.mana.colorless
    );

}


// ======================================================
// CAN PAY MANA
// ======================================================

function canPayMana(
    player,
    cost
) {

    let white =
        player.mana.white;

    let blue =
        player.mana.blue;

    let black =
        player.mana.black;

    let red =
        player.mana.red;

    let green =
        player.mana.green;

    let colorless =
        player.mana.colorless;


    if (
        white < cost.white ||
        blue < cost.blue ||
        black < cost.black ||
        red < cost.red ||
        green < cost.green ||
        colorless < cost.colorless
    ) {

        return false;

    }


    const coloredUsed =
        cost.white +
        cost.blue +
        cost.black +
        cost.red +
        cost.green +
        cost.colorless;


    const remaining =
        (
            white -
            cost.white
        ) +

        (
            blue -
            cost.blue
        ) +

        (
            black -
            cost.black
        ) +

        (
            red -
            cost.red
        ) +

        (
            green -
            cost.green
        ) +

        (
            colorless -
            cost.colorless
        );


    return (
        remaining >=
        cost.generic
    );

}


// ======================================================
// PAY MANA
// ======================================================

function payMana(
    player,
    cost
) {

    player.mana.white -=
        cost.white;

    player.mana.blue -=
        cost.blue;

    player.mana.black -=
        cost.black;

    player.mana.red -=
        cost.red;

    player.mana.green -=
        cost.green;

    player.mana.colorless -=
        cost.colorless;


    let generic =
        cost.generic;


    const colors = [

        "colorless",
        "white",
        "blue",
        "black",
        "red",
        "green"

    ];


    for (
        const color of colors
    ) {

        const amount =
            Math.min(
                player.mana[color],
                generic
            );


        player.mana[color] -=
            amount;


        generic -=
            amount;


        if (
            generic <= 0
        ) {

            break;

        }

    }


    updateAvailableMana(
        player
    );

}


// ======================================================
// UPDATE AVAILABLE MANA
// ======================================================

function updateAvailableMana(
    player
) {

    player.mana.available =
        getTotalMana(player);

}


// ======================================================
// SPELL RESOLUTION
// ======================================================

function resolveSpell(
    playerId,
    card
) {

    const opponentId =
        playerId === 0
            ? 1
            : 0;


    const text =
        (
            card.oracleText ||
            ""
        ).toLowerCase();


    // ==============================================
    // DAMAGE
    // ==============================================

    const damageMatch =
        text.match(
            /deals?\s+(\d+)\s+damage/
        );


    if (damageMatch) {

        const amount =
            Number(
                damageMatch[1]
            );


        dealDamage(
            opponentId,
            amount
        );

    }


    // ==============================================
    // DRAW
    // ==============================================

    const drawMatch =
        text.match(
            /draw\s+(?:a|(\d+))\s+card/
        );


    if (
        text.includes(
            "draw a card"
        )
    ) {

        drawCard(
            playerId
        );

    } else if (
        drawMatch &&
        drawMatch[1]
    ) {

        drawCards(
            playerId,
            Number(
                drawMatch[1]
            )
        );

    }


    currentGame.players[playerId]
        .graveyard
        .push(card);


    logGame(
        `${card.name} resolved.`
    );


    renderGame();

}


// ======================================================
// CARD HELPERS
// ======================================================

function isLand(card) {

    return card.types.includes(
        "Land"
    );

}


function isCreature(card) {

    return card.types.includes(
        "Creature"
    );

}


function isInstant(card) {

    return card.types.includes(
        "Instant"
    );

}


function isSorcery(card) {

    return card.types.includes(
        "Sorcery"
    );

}


function getPower(card) {

    const value =
        Number(card.power);


    if (
        Number.isNaN(value)
    ) {

        return 0;

    }


    return value;

}


function getToughness(card) {

    const value =
        Number(card.toughness);


    if (
        Number.isNaN(value)
    ) {

        return 0;

    }


    return value;

}


// ======================================================
// WIN / LOSE
// ======================================================

function loseGame(
    playerId,
    reason
) {

    if (
        currentGame.status ===
        "finished"
    ) {

        return;

    }


    const loser =
        currentGame.players[playerId];


    const winnerId =
        playerId === 0
            ? 1
            : 0;


    const winner =
        currentGame.players[winnerId];


    loser.hasLost = true;

    winner.hasWon = true;


    currentGame.winner =
        winnerId;


    currentGame.status =
        "finished";


    logGame(
        `${loser.name} lost: ${reason}`
    );


    logGame(
        `${winner.name} wins!`
    );


    renderGame();

}


// ======================================================
// LOG
// ======================================================

function logGame(
    message
) {

    if (!currentGame) {

        return;

    }


    currentGame.log.push({

        turn:
            currentGame.turn,

        message:
            message,

        timestamp:
            Date.now()

    });

}


// ======================================================
// CURRENT PLAYER
// ======================================================

function getCurrentPlayer() {

    return currentGame.players[
        currentGame.activePlayer
    ];

}
// ======================================================
// LOAD PENDING GAME
// ======================================================

function startPendingGame() {

    console.log(
        "Checking for pending game..."
    );


    const saved =
        sessionStorage.getItem(
            "mtg_pending_game"
        );


    if (!saved) {

        console.error(
            "No pending game found."
        );


        return;

    }


    let config;


    try {

        config =
            JSON.parse(saved);

    } catch (error) {

        console.error(
            "Invalid game config:",
            error
        );


        return;

    }


    sessionStorage.removeItem(
        "mtg_pending_game"
    );


    console.log(
        "Game configuration loaded."
    );


    startGameEngine(
        config.mode,
        config.playerDeck,
        config.opponentDeck
    );

}
