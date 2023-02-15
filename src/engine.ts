import * as PIXI from "pixi.js";
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

import { Connection } from "./Connection";
import { firework, getCards, getPileByPos, Suits } from "./util";
import { Deck } from "./Deck";
import { Piles } from "./Piles";
import { Foundations } from "./Foundations";
import { Card } from "./Card";

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

const app = new PIXI.Application({
    width: 1230,
    height: 870,
    backgroundColor: 0x7eb300
});

const newGameBtn = createNewGameBtn();
const time = createTimeText();
const movesTxt = createMovesText();

app.stage.addChild(newGameBtn, time, movesTxt);

const boardSection = document.getElementById('board');

let state: any = {};
let move = null;
let moves = null;
let movesMade = 0;

let connectionRef;
let allCards;
let deck;
let piles;
let foundations;
let overlay;

let elapsedSec = 0;

export async function engine(connection: Connection) {
    connectionRef = connection;
    boardSection.innerHTML = '';

    boardSection.appendChild(app.view as HTMLCanvasElement);
    app.ticker.add(update);

    loadGame();

    //new game
    newGameBtn.on('pointerup', (e) => {
        connection.send('newGame');
    })

    connection.on('state', onState);
    connection.on('moves', onMoves);
    connection.on('moveResult', onResult);
    connection.on('victory', onVictory);

}

function onState(receivedState) {
    console.log('received state', receivedState);

    state = receivedState;
    startGame();
}

function onMoves(receivedMoves) {
    moves = receivedMoves;
    console.log('received moves', moves);
}

function onResult(data) {
    console.log(move, data);

    if (move != null) {
        if (move.action == 'flip') {
            if (move.source == 'stock') {
                if (data != null) {
                    if (deck.moves < 24) {
                        deck.revealNext(data);
                    } else {
                        deck.revealNext();
                    }
                    movesMade++;
                }
            } else {
                let pileIndex = move.source.slice(-1);
                let cardToFlip = piles.pack.find(c => c.pilePos == `${pileIndex}-${move.index}`);
                cardToFlip.suit = Suits[data.suit];
                cardToFlip.rank = data.face - 1;

                let cardFace = allCards.find(x => x.suit == cardToFlip.suit && x.rank == cardToFlip.rank);

                cardToFlip.addFace(cardFace);
                cardToFlip.flip();
            }
        } else if (move.action == 'place') {
            if (move.source == 'stock') {
                let card = deck.revealedPack.find(c => c.index == move.index);

                if (move.target.includes('pile')) {
                    const pileIndex = Number(move.target[4]);
                    card.place(data, deck, piles, overlay, pileIndex)
                } else if (Object.keys(Suits).includes(move.target)) {
                    card.place(data, deck, foundations, overlay, move.target)
                }
            } else if (move.source.includes('pile')) {
                const sourcePileIndex = Number(move.source[4]);
                const cardIndex = Number(move.index);

                let card = piles.pack.find(c => c.pilePos == `${sourcePileIndex}-${cardIndex}`);

                if (move.target.includes('pile')) {
                    const pileIndex = Number(move.target[4]);
                    if (overlay.children.length > 1) {
                        card.place(data, piles, piles, overlay, pileIndex, overlay.children.map(c => (c as Card)))
                    } else {
                        card.place(data, piles, piles, overlay, pileIndex)
                    }
                } else if (Object.keys(Suits).includes(move.target)) {
                    card.place(data, piles, foundations, overlay, move.target)
                }

                if (data) {
                    let prevCardIndex = cardIndex - 1;
                    let prevCard = piles.pack.find(c => c.pilePos == `${sourcePileIndex}-${prevCardIndex}`);

                    console.log(prevCard);

                    if (prevCard && !prevCard.fasingUp) {
                        move = {
                            action: 'flip',
                            source: 'pile' + sourcePileIndex,
                            target: null,
                            index: cardIndex - 1,
                        };

                        connectionRef.send('move', move);
                    } else {
                        move = null
                    }
                }

            }
            if (data) {
                movesMade++;
            }

        }
    }
}

function onVictory() {
    for (let i = 0; i < 25; i++) {
        const sparkles = firework(150 + Math.random() * 900, 100 + Math.random() * 640, ((Math.random() * 256 | 0) << 16) + ((Math.random() * 256 | 0) << 8) + (Math.random() * 256 | 0));
        app.stage.addChild(sparkles);
    }
}

async function startGame() {
    elapsedSec = 0;
    movesMade = 0;
    if (deck) {
        app.stage.removeChildren(3);
    }

    const foundationsInfo = [['clubs', 'assets/clubs.svg'], ['hearts', 'assets/hearts.svg'], ['spades', 'assets/spades.svg'], ['diamonds', 'assets/diamonds.svg']];
    let spreadsheet = await PIXI.Assets.load<PIXI.BaseTexture>('assets/deck.jpg');
    const cards = getCards(spreadsheet);

    allCards = [...cards.s, ...cards.d, ...cards.c, ...cards.h];

    deck = new Deck(state.stock, state.waste, allCards);
    piles = new Piles(state.piles, allCards);
    foundations = new Foundations(state.foundations, foundationsInfo, allCards);
    overlay = createOverlay();

    userInteractions(piles, deck, foundations, overlay);

    app.stage.addChild(foundations, piles, deck, overlay);
}

function userInteractions(piles: Piles, deck: Deck, foundations: Foundations, overlay: PIXI.Sprite) {
    const allCards = [...piles.pack, ...deck.pack, ...deck.revealedPack];

    deck.onClickRetry(connectionRef, move);

    allCards.forEach(c => {
        c.on('pointerdown', (e) => {
            let action = 'take';
            const pileIndex = c.pilePos.split('-')[0];
            let index: any;
            const type = c.location;

            if (e.x >= 10 && e.x <= 156 && e.y >= 10 && e.y <= 298) {
                action = 'flip';
                index = Number(c.index);
            } else {
                index = Number(c.pilePos.split('-')[1]);
            }

            move = {
                action,
                source: type,
                target: null,
                index
            };

            if (type == 'pile') {
                move.source += pileIndex;
            } else if (type == 'stock') {
                move.index = Number(c.index);
            }

            connectionRef.send('move', move);

            c.select(piles, deck, e.globalX, e.globalY, overlay);
        });

        c.on('pointerup', (e) => {
            if (c.moving) {
                let action = 'place'
                let type = c.location;
                let target = getPileByPos(e.globalX, e.globalY);
                let index = Number(c.index);

                if (target != 'deal') {
                    if (type == 'pile') {
                        type += c.pilePos.split('-')[0];
                        index = Number(c.pilePos.split('-')[1]);
                    }
                    if (typeof target == 'number') {
                        target = 'pile' + target
                    }

                    move = {
                        action,
                        source: type,
                        target,
                        index
                    };
                    console.log(move);


                    connectionRef.send('move', move);
                } else {
                    c.placeBackToDeck(deck, overlay);
                }
            }
        });
    })
}


function createOverlay() {
    const wrap = new PIXI.Sprite();
    wrap.interactive = true;

    wrap.on('pointermove', (e) => {
        if (wrap.children.length == 1) {
            const card = wrap.getChildAt(0) as Card
            card.move(e.globalX, e.globalY, null);
        } else if (wrap.children.length > 1) {
            const card = wrap.getChildAt(0) as Card
            card.move(e.globalX, e.globalY, wrap.children.map(c => (c as Card)));
        }
    })

    return wrap;
}

function update(dt) {

    if (movesMade >= 1) {
        elapsedSec += 1 / 60 * dt;

        let min = (elapsedSec / 60) | 0;
        let sec = (elapsedSec | 0) % 60;

        if (min < 10) {
            if (sec < 10) time.text = `Time: 0${min}:0${sec}`;
            else time.text = `Time: 0${min}:${sec}`;
        } else {
            if (sec < 10) time.text = `Time: ${min}:$0{sec}`;
            else time.text = `Time: ${min}:${sec}`;
        }

        movesTxt.text = 'Moves: ' + movesMade;
    } else {
        time.text = `Time: 00:00`;
        movesTxt.text = 'Moves: ' + movesMade;
    }
    //movesMade == 1 -> show time on screen 
}

async function loadGame() {
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/card-back.jpeg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/clubs.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/diamonds.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/hearts.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/spades.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/retry.svg');
}

function createNewGameBtn() {
    const container = new PIXI.Container();
    const graphic = new PIXI.Graphics();
    graphic.beginFill(0x191C37);
    graphic.drawRoundedRect(0, 0, 122, 30, 15)
    graphic.endFill();

    const text = new PIXI.Text();
    text.style = new PIXI.TextStyle({
        fontSize: 19,
        fill: 0xffffff
    })
    text.text = 'New Game'
    text.anchor.set(0.5);
    text.position.set(61, 15)

    container.interactive = true;
    container.addChild(graphic, text);
    container.position.set(29, 15)

    return container;
}

function createTimeText() {
    PIXI.BitmapFont.from('InputFont', {
        fontSize: 19,
        fill: 'black',
    }, {
        chars: [['a', 'z'], ['0', '9'], ['A', 'Z'], ' :.']
    });

    const text = new PIXI.BitmapText('Time: ', { fontName: 'InputFont' });

    text.anchor.set(0, 0.5)
    text.position.set(200, 30)

    return text;
}

function createMovesText() {
    PIXI.BitmapFont.from('InputFont', {
        fontSize: 19,
        fill: 'black',
    }, {
        chars: [['a', 'z'], ['0', '9'], ['A', 'Z'], ' :.']
    });

    const text = new PIXI.BitmapText('Moves: ', { fontName: 'InputFont' });

    text.anchor.set(0, 0.5)
    text.position.set(340, 30)

    return text;
}