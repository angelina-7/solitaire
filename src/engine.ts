import * as PIXI from "pixi.js";
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

import { Connection } from "./Connection";
import { getCards, ICards } from "./util";
import { Deck } from "./Deck";
import { Piles } from "./Piles";

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

export function engine(connection: Connection) {
    const state = {};

    actionSection.innerHTML = '';
    boardSection.innerHTML = '';

    boardSection.appendChild(app.view as HTMLCanvasElement);
    app.ticker.add(update);
    loadGame()
        .then((cards: ICards) => {
            startGame(connection, cards);
        })

    connection.on('state', onState);

    function onState(state) {
        console.log('received state', state);
    }
}

let elapsed = 0;
function update(dt) {
    elapsed += dt;
    loadBar.beginFill(0x000000);
    loadBar.drawRect(0, 0, Math.min(50 + (elapsed * 10), 400), 50);
}

async function loadGame() {
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/card-back.jpeg');
    let spreadsheet = await PIXI.Assets.load<PIXI.BaseTexture>('assets/deck.jpg');

    const cards = getCards(spreadsheet);

    app.stage.removeChild(loadBar);

    return cards;
}

function startGame(connection: Connection, cards: ICards) {
    let startingDeck = [...cards.s, ...cards.d, ...cards.c, ...cards.h];
    const shuffledDeck: any = startingDeck.sort((a, b) => 0.5 - Math.random());

    let piles = new Piles();

    let deck = new Deck();
    deck.on('pointerup', () => {
        console.log(deck.moves)
        if (deck.moves < 24) {
            deck.revealNext(piles, shuffledDeck, shuffledDeck.pop());
        } else {
            deck.revealNext(piles, shuffledDeck);
        }

        console.log('shuffled deck', shuffledDeck);
    })

    console.log(shuffledDeck);

    setTimeout(() => {
        piles.reveal('1-1', shuffledDeck, shuffledDeck.pop());
        piles.reveal('2-2', shuffledDeck, shuffledDeck.pop());
        piles.reveal('3-3', shuffledDeck, shuffledDeck.pop());
        piles.reveal('4-4', shuffledDeck, shuffledDeck.pop());
        piles.reveal('5-5', shuffledDeck, shuffledDeck.pop());
        piles.reveal('6-6', shuffledDeck, shuffledDeck.pop());
        piles.reveal('7-7', shuffledDeck, shuffledDeck.pop());
    }, 5000)


    app.stage.addChild(piles, deck)


    // const card = new Card();

    // card.addFace(cards.h[Rank.king]);
    // setInterval(() => {
    //     card.flip();

    // }, 2000);

    // card.position.set(400, 400);

    // app.stage.addChild(card);
}
