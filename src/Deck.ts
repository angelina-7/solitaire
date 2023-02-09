import * as PIXI from "pixi.js";
import { gsap } from "gsap";

import { Card } from "./Card";
import { Suits } from "./util";

export class Deck extends PIXI.Container {
    public pack: Card[] = [];
    public revealedPack: Card[] = [];
    public moves: number = 0;

    constructor(public allCards) {
        super();
        this.position.set(90, 120);

        for (let i = 0; i < 24; i++) {
            let card = new Card();
            card.location = 'stock';
            card.index = i;
            this.pack.push(card);
        }

        this.sortableChildren = true;
        this.addChild(...this.pack);

        let retry = new PIXI.Container();

        let bt = new PIXI.Graphics();
        bt.beginFill(0xffffff);
        bt.drawRoundedRect(-25, -25, 50, 50, 10);
        bt.endFill();

        let retrySprite = PIXI.Sprite.from('assets/retry.svg');
        retrySprite.scale.set(0.3);
        retrySprite.anchor.set(0.5);

        retry.addChild(bt, retrySprite);

        this.addChildAt(retry, 0);

        retry.interactive = true;

        retry.on('pointerdown', () => {
            console.log('retry');

            const tl = gsap.timeline({ defaults: { duration: 0.05 } });

            //wait for animation onReveal to finish
            let revealed = this.revealedPack.length
            for (let i = 0; i < revealed; i++) {
                let card: Card = this.revealedPack.shift();

                card.flip();
                tl.to(card, { x: 0, ease: 'none' });
                this.pack.push(card);
            }
        });
    }

    revealNext(cardInfo?) {
        let lastCard = this.revealedPack[this.revealedPack.length - 1];

        if (!lastCard?.moving) {
            if (this.moves < 24) {
                this.revealNextByAdding(cardInfo);
            } else {
                if (this.pack.length > 0) {
                    let card = this.pack.shift();
                    card.flip();
                    gsap.to(card, { x: 175 });

                    this.revealedPack.push(card);
                }
            }
        }
    }

    revealNextByAdding(cardInfo) {
        this.moves++;
        let card = this.pack.shift();
        card.suit = Suits[cardInfo.suit];
        card.rank = cardInfo.face - 1;
        card.pilePos = 'deal';
        this.revealedPack.push(card);

        let cardFace = this.allCards.find(x => x.suit == card.suit && x.rank == card.rank);

        card.addFace(cardFace);
        card.flip();
        gsap.to(card, { x: 175 });
    }
}