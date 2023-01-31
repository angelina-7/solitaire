import * as PIXI from "pixi.js";
import {gsap} from "gsap";
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

        this.addChild(...this.pack);

        this.on('pointerdown', () => {
            console.log('from deck');
        });
    }

    revealNext(face?) {
        this.moves++;
        if (this.moves <= 24) {
            this.revealNextByAdding(face);
        } else {
            if (this.pack.length > 0) {
                let card = this.pack.shift();
                card.flip();
                gsap.to(card, {x: 175});
    
                this.revealedPack.push(card);
            } else {
                for (let i = 0; i < 24; i++) {
                    let card = this.revealedPack.shift();
                    card.flip();
                    gsap.to(card, {x: 0, delay: 1});
                    this.pack.push(card);
                }
            }
        }
    }

    revealNextByAdding(face) {
        console.log(face)
        if (this.pack.length > 0) {
            let card = this.pack.shift();
            card.suit = face.suit;
            card.rank = face.rank;

            this.revealedPack.push(card);

            card.addFace(face);
            card.flip();
            gsap.to(card, {x: 175});
        } else {
            for (let i = 0; i < 24; i++) {
                let card = this.revealedPack.shift();
                card.flip();
                gsap.to(card, {x: 0, delay: 1});
                this.pack.push(card);
            }
        }
    }
}