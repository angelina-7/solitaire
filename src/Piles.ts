import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

import { getPilePosX, Suits } from './util';
import { Card } from './Card';

export class Piles extends PIXI.Container {
    public pack: Card[] = [];
    private _pilesState = [];

    constructor(public state: Object, public allCards: any) {
        super();

        let cardsInPiles = this.calcCards();
        for (let i = 0; i < cardsInPiles; i++) {
            this.pack.push(new Card());
        }

        this.position.set(90, 160);
        this.sortableChildren = true;
        this.addChild(...this.pack);

        this.dealCards()
    }

    private calcCards() {
        return this.state[0].cards.length + this.state[1].cards.length + this.state[2].cards.length + this.state[3].cards.length
            + this.state[4].cards.length + this.state[5].cards.length + this.state[6].cards.length;
    }

    get pilesState(): Card[][] {
        return this._pilesState;
    }

    dealCards() {
        const tl = gsap.timeline({ delay: 0.5 });

        let i = 0;
        for (let pile = 0; pile < 7; pile++) {
            this.pilesState.push([]);

            let currCardArr = this.state[pile].cards;
            for (let n = 0; n < currCardArr.length; n++) {
                let card = this.pack[i];
                card.pilePos = `${pile}-${n}`;
                card.location = 'pile';

                if (currCardArr[n].faceUp) {
                    card.rank = this.state[pile].cards[n].face - 1;
                    card.suit = Suits[this.state[pile].cards[n].suit];
                }

                card.interactive = true;
                this.pilesState[pile].push(card);

                tl.to(card, {
                    x: getPilePosX(pile), y: 200 + (n * 40), duration: 0.15, onComplete: () => {
                        if (card.rank != null && card.suit != null) {
                            let cardFace = this.allCards.find(x => x.suit == card.suit && x.rank == card.rank);
                            card.addFace(cardFace);
                            card.flip();
                        }
                    }
                });

                i++;
            }
        }
    }

    // reveal(cardPos: string, face, next?) {
    //     console.log(next)
    //     let card = this.pack.find(x => x.pilePos == cardPos);
    //     card.suit = face.suit;
    //     card.rank = face.rank;
    //     card.addFace(face);
    //     card.flip();
    // }
}