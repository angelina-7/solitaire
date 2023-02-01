import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { Card } from "./Card";

export class Deck extends PIXI.Container {
    public pack: Card[] = [];
    public revealedPack: Card[] = [];
    public moves: number = 0;

    constructor() {
        super();
        this.position.set(90, 120);

        for (let i = 0; i < 24; i++) {
            this.pack.push(new Card());
        }
        this.sortableChildren = true;
        this.addChild(...this.pack);

        let bt = new PIXI.Graphics();
        bt.beginFill(0xffffff);
        bt.drawRoundedRect(-25, -25, 50, 50, 10);
        bt.endFill();

        this.addChildAt(bt, 0);
        bt.interactive = true;
        bt.on('pointerup', () => {
            const tl = gsap.timeline({defaults:  {duration: 0.05}});

            for (let i = 0; i < 24; i++) {
                let card = this.revealedPack.shift();

                if (card) {
                    console.log(card.eventNames())
                    if(card.eventNames().length > 0) {
                        card.removeAllListeners();
                    }
                    
                    card.flip();
                    tl.to(card, {x: 0, ease: 'none'});
                    this.pack.push(card);
                }
            }
        });
    }

    revealNext(piles, shuffledDeck, face?) {
        let lastCard = this.revealedPack[this.revealedPack.length - 1];

        if (!lastCard?.moving) {
            if (this.moves < 24) {
                this.revealNextByAdding(piles, shuffledDeck, face);
            } else {
                if (this.pack.length > 0) {
                    let card = this.pack.shift();
                    card.move(shuffledDeck, piles, this);
                    card.flip();
                    gsap.to(card, { x: 175 });

                    this.revealedPack.push(card);
                } 
            }
        }
    }

    revealNextByAdding(piles, shuffledDeck, face) {
            this.moves++;
            let card = this.pack.shift();
            card.suit = face.suit;
            card.rank = face.rank;

            this.revealedPack.push(card);

            card.addFace(face);
            card.flip();
            card.move(shuffledDeck, piles, this);
            gsap.to(card, { x: 175 });
    }
}