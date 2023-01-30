import * as PIXI from "pixi.js";
import {gsap} from "gsap";
import { Card } from "./Card";

export class Deck extends PIXI.Container {
    public pack: Card[] = [];

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
}