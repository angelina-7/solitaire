import * as PIXI from "pixi.js";
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

import { Connection } from "./Connection";
import { firework, getCards, getPileByPos, ICardContainer, ICards, Suits } from "./util";
import { Deck } from "./Deck";
import { Piles } from "./Piles";
import { Foundations } from "./Foundations";
import { Card } from "./Card";

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

const app = new PIXI.Application({
    width: 1225,
    height: 840,
    backgroundColor: 0x7eb300
});

const loadBar = new PIXI.Graphics();
loadBar.lineStyle({ width: 3, color: 0x000000 });
loadBar.drawRect(0, 0, 400, 50);
loadBar.position.set(400, 370);
app.stage.addChild(loadBar);


const actionSection = document.getElementById('action');
const boardSection = document.getElementById('board');

export async function engine(connection: Connection) {
    let state: any = {};
    let move = null;
    let moves = null;

    loadGame();

    connection.on('state', onState);
    connection.on('moves', onMoves);
    connection.on('moveResult', onResult);
    connection.on('victory', onVictory);

    const foundationsInfo = [['clubs', 'assets/clubs.svg'], ['hearts', 'assets/hearts.svg'], ['spades', 'assets/spades.svg'], ['diamonds', 'assets/diamonds.svg']];
    let spreadsheet = await PIXI.Assets.load<PIXI.BaseTexture>('assets/deck.jpg');
    const cards = getCards(spreadsheet);

    let allCards = [...cards.s, ...cards.d, ...cards.c, ...cards.h];
    // const shuffledDeck = allCards.sort((a, b) => 0.5 - Math.random());

    let deck = new Deck(allCards);
    let piles = new Piles(state.piles, allCards);
    let foundations = new Foundations(foundationsInfo);
    let overlay = createOverlay();

    actionSection.innerHTML = '';
    boardSection.innerHTML = '';

    boardSection.appendChild(app.view as HTMLCanvasElement);
    app.ticker.add(update);

    startGame(deck, piles, foundations, overlay);

    function onState(receivedState) {
        console.log('received state', receivedState);

        state = receivedState;
    }

    function onMoves(receivedMoves) {
        moves = receivedMoves;
        console.log('received moves', moves);
        // mergeMoves();
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
                    }
                }
            } else if (move.action == 'place') {
                if (move.source == 'stock') {
                    let card = deck.revealedPack.find(c => c.index == move.index);
                    // console.log(card);

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
                    // console.log(card);

                    if (move.target.includes('pile')) {
                        const pileIndex = Number(move.target[4]);
                        card.place(data, piles, piles, overlay, pileIndex, () => { })
                    } else if (Object.keys(Suits).includes(move.target)) {
                        card.place(data, piles, foundations, overlay, move.target, () => { })
                    }

                    if (data) {
                        move = {
                            action: 'flip',
                            source: 'pile' + sourcePileIndex,
                            target: null,
                            index: cardIndex - 1,
                        };

                        connection.send('move', move);
                    }
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

    function startGame(deck, piles, foundations, overlay) {

        userInteractions(piles, deck, foundations, overlay);

        app.stage.addChild(foundations, piles, deck, overlay);
    }

    function userInteractions(piles: Piles, deck: Deck, foundations: Foundations, overlay: PIXI.Sprite) {
        const allCards = [...piles.pack, ...deck.pack];

        deck.onClickRetry(connection, move);

        //all cards have listeners but triggered only when fasing up
        allCards.forEach(c => {

            let selectedCards;

            c.on('pointerdown', (e) => {
                // console.log(c.location);

                let action = 'take';
                const pileIndex = c.pilePos.split('-')[0];
                let index: any;
                // const action = card.dataset.action;
                // const stack = card.parentElement;
                // const suit = stack.dataset.suit;
                const type = c.location;

                if (e.x >= 10 && e.x <= 156 && e.y >= 10 && e.y <= 298) {
                    action = 'flip';
                    index = Number(c.index);
                } else {
                    index = c.pilePos.split('-')[1];
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

                connection.send('move', move);

                selectedCards = c.select(piles, deck, e.globalX, e.globalY, overlay);
            });

            // c.on('pointermove', (e) => {
            //     if (selectedCards) {
            //         c.move(e.globalX, e.globalY, selectedCards);
            //     }
            //     else {
            //         c.move(e.globalX, e.globalY);
            //     }

            // });

            c.on('pointerup', (e) => {
                if (c.moving) {
                    let action = 'place'
                    let type = c.location;
                    let target = getPileByPos(e.globalX, e.globalY);
                    let index = Number(c.index);

                    if (type == 'pile') {
                        type += c.pilePos.split('-')[0];
                        index = Number(c.pilePos.split('-')[1]);
                    }
                    if (target == 'deal') {
                        target == null
                    } else if (typeof target == 'number') {
                        target = 'pile' + target
                    }

                    move = {
                        action,
                        source: type,
                        target,
                        index
                    };

                    connection.send('move', move);
                }
            });
        })
    }
}

function createOverlay() {
    const wrap = new PIXI.Sprite();
    wrap.interactive = true;
    // wrap.hitArea = new PIXI.Rectangle(0,0, 1225, 840)

    wrap.on('pointermove', (e) => {
        // console.log('overlay move', wrap, e.globalX, e.globalY);
        const card = wrap.getChildAt(0) as Card
        if (card) {
            card.move(e.globalX, e.globalY, null);
        }
    })

    return wrap;
}

let elapsed = 0;
function update(dt) {
    elapsed += dt;
    loadBar.beginFill(0x000000);
    loadBar.drawRect(0, 0, Math.min(50 + (elapsed * 10), 400), 50);
}

async function loadGame() {
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/card-back.jpeg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/clubs.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/diamonds.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/hearts.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/spades.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/retry.svg');

    app.stage.removeChild(loadBar);
}
