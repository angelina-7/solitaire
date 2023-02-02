import * as PIXI from "pixi.js";
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

import { Connection } from "./Connection";
import { getCards, ICardContainer, ICards } from "./util";
import { Deck } from "./Deck";
import { Piles } from "./Piles";
import { Foundations } from "./Foundations";

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
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/clubs.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/diamonds.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/hearts.svg');
    await PIXI.Assets.load<PIXI.BaseTexture>('assets/spades.svg');
    let spreadsheet = await PIXI.Assets.load<PIXI.BaseTexture>('assets/deck.jpg');

    const cards = getCards(spreadsheet);

    app.stage.removeChild(loadBar);

    return cards;
}

function startGame(connection: Connection, cards: ICards) {
    const foundationsInfo = [['clubs', 'assets/clubs.svg'], ['hearts', 'assets/hearts.svg'], ['spades', 'assets/spades.svg'], ['diamonds', 'assets/diamonds.svg']];
    let startingDeck = [...cards.s, ...cards.d, ...cards.c, ...cards.h];
    // console.log(startingDeck);

    const shuffledDeck = startingDeck.sort((a, b) => 0.5 - Math.random());

    let piles = new Piles();
    let deck = new Deck();
    let foundations = new Foundations(foundationsInfo);

    setTimeout(() => {
        piles.reveal('0-0', shuffledDeck.pop());
        piles.reveal('1-1', shuffledDeck.pop());
        piles.reveal('2-2', shuffledDeck.pop());
        piles.reveal('3-3', shuffledDeck.pop());
        piles.reveal('4-4', shuffledDeck.pop());
        piles.reveal('5-5', shuffledDeck.pop());
        piles.reveal('6-6', shuffledDeck.pop());
    }, 5000);

    userInteractions(piles, deck, foundations, shuffledDeck);

    app.stage.addChild(foundations, piles, deck);


}

function userInteractions(piles: Piles, deck: Deck, foundations: Foundations, shuffledDeck: ICardContainer[]) {
    deck.on('pointerdown', (e) => {
        // console.log(deck.moves)
        // console.log(e.x, e.y)
        if (e.x >= 10 && e.x <= 156 && e.y >= 10 && e.y <= 298) {
            if (deck.moves < 24) {
                deck.revealNext(shuffledDeck.pop());
            } else {
                deck.revealNext();
            }
        }
    });

    const allCards = [...piles.pack, ...deck.pack];

    //all cards have listeners but triggered only when fasing up
    allCards.forEach(c => {
        let selectedCards;
        c.on('pointerdown', (e) => {
            selectedCards = c.select(piles, deck, e.globalX, e.globalY);
        });

        c.on('pointermove', (e) => {
            if (selectedCards) {
                c.move(e.globalX, e.globalY, selectedCards);
            }
            else {
                c.move(e.globalX, e.globalY);
            }

        });

        c.on('pointerup', (e) => {
            if (selectedCards) {
                c.place(piles, deck, foundations, shuffledDeck, e.globalX, e.globalY, selectedCards);
            } else {
                c.place(piles, deck, foundations, shuffledDeck, e.globalX, e.globalY);
            }
            selectedCards = null;
        });

    })

}
