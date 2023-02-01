import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

import { getPilePosX } from './util';
import { Card } from './Card';

export class Piles extends PIXI.Container {
    public pack: Card[] = [];
    private _pilesState = [];

    constructor() {
        super();

        for (let i = 0; i < 28; i++) {
            this.pack.push(new Card());
        }

        this.position.set(90, 120);
        this.sortableChildren = true;
        this.addChild(...this.pack);

        this.dealCards()

    }

    get pilesState(): Card[][] {
        return this._pilesState;
    }

    dealCards() {
        const tl = gsap.timeline({ delay: 0.5 });

        let i = 0;
        for (let pile = 0; pile < 7; pile++) {
            this.pilesState.push([]);

            for (let n = 0; n < 7; n++) {
                if (n <= pile) {
                    let card = this.pack[i];
                    card.pilePos = `${pile}-${n}`;
                    card.interactive = true;
                    this.pilesState[pile].push(card);

                    tl.to(card, { x: getPilePosX(pile), y: 200 + (n * 40), duration: 0.15 });
                    i++;

                    // card.on('pointerdown', () => {
                    //     console.log('from piles');
                    //     console.log(card.pilePos, card.suit, card.rank);
                    // });
                }
            }
        }
    }

    reveal(cardPos: string, face) {
        let card = this.pack.find(x => x.pilePos == cardPos);
        card.suit = face.suit;
        card.rank = face.rank;
        card.addFace(face);
        card.flip();
    }
}