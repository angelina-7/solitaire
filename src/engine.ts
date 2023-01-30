import { Connection } from "./Connection";
import * as PIXI from "pixi.js";
import { getCards, getSuit, Rank, ICards, SuitName } from "./util";
import { Deck } from "./Deck";

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { Card } from "./Card";
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
        .then((assets: ICards) => {
            startGame(connection, assets);
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
    let piles = new Piles();
    let deck = new Deck();
    setTimeout(() => {
        piles.reveal('1-1', cards.s[Rank._10]);
        piles.reveal('2-2', cards.d[Rank.ace]);
        piles.reveal('3-3', cards.s[Rank._4]);
        piles.reveal('4-4', cards.d[Rank.jack]);
        piles.reveal('5-5', cards.h[Rank._2]);
        piles.reveal('6-6', cards.c[Rank.king]);
        piles.reveal('7-7', cards.c[Rank._10]);
    }, 5000)

    const pilesPositions = piles.getPositions;

    console.log(pilesPositions)


    app.stage.addChild(deck, piles)

    // const card = new Card();

    // card.addFace(cards.h[Rank.king]);
    // setInterval(() => {
    //     card.flip();

    // }, 2000);

    // card.position.set(400, 400);

    // app.stage.addChild(card);
}
