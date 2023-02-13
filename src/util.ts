import * as PIXI from "pixi.js";
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export interface ICardContainer extends PIXI.Container {
    suit: SuitName;
    rank: Rank;
}

export interface IFoundationContainer extends PIXI.Container {
    color: string;
}

export interface ICards {
    'c': ICardContainer[],
    'h': ICardContainer[],
    's': ICardContainer[],
    'd': ICardContainer[],
}

export const Suits = {
    'clubs': 0,
    'hearts': 1,
    'spades': 2,
    'diamonds': 3
}

export enum SuitName {
    clubs, hearts, spades, diamonds
}

export enum Rank {
    ace, _2, _3, _4, _5, _6, _7, _8, _9, _10, jack, queen, king
}

export function getCards(sheet: PIXI.BaseTexture): ICards {
    return {
        'c': getSuit(sheet, SuitName.clubs),
        'h': getSuit(sheet, SuitName.hearts),
        's': getSuit(sheet, SuitName.spades),
        'd': getSuit(sheet, SuitName.diamonds)
    }
}

export function getSuit(sheet: PIXI.BaseTexture, name: SuitName): ICardContainer[] {
    const result = new Array<ICardContainer>();

    for (let i = 0; i < 13; i++) {
        const container: ICardContainer = new PIXI.Container() as ICardContainer;
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(0, 0, 404, 618, 34);
        mask.endFill();

        container.suit = name
        container.rank = i;

        const border = new PIXI.Graphics();
        border.lineStyle({ width: 2, color: 0x000000 });
        border.drawRoundedRect(0, 0, 404, 618, 34);

        const cardTexture = new PIXI.Texture(sheet, new PIXI.Rectangle(50 + (i * 458), 850 + (name * 660), 404, 618));
        const card = PIXI.Sprite.from(cardTexture);
        card.mask = mask;

        container.addChild(card, mask, border);
        // container.pivot.set(204, 311)
        container.pivot.set(204, 0)
        container.scale.set(0.3);

        result.push(container);
    }

    return result;

}

export function getCardBack() {
    const back = new PIXI.Container();

    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(0, 0, 120, 183, 12);
    mask.endFill();

    const cardBack = PIXI.Sprite.from('assets/card-back.jpeg');
    cardBack.scale.set(0.2);
    cardBack.mask = mask;

    const border = new PIXI.Graphics();
    border.lineStyle({ width: 2, color: 0x000000 });
    border.drawRoundedRect(0, 0, 120, 183, 12);

    back.addChild(cardBack, mask, border);

    return back;
}

export function getPilePosX(pile: number): number {
    let xpos: number;

    if (pile == 0) {
        xpos = 0;
    } else if (pile == 1) {
        xpos = 175;
    } else if (pile == 2) {
        xpos = 350;
    } else if (pile == 3) {
        xpos = 525;
    } else if (pile == 4) {
        xpos = 700;
    } else if (pile == 5) {
        xpos = 875;
    } else if (pile == 6) {
        xpos = 1050;
    }

    return xpos;
}

export function getPileByPos(x: number, y: number, currPile?): number | string {
    let pile: number;

    if (y < 250) {
        if (x < 450) {
            return 'deal';
        } else if (x < 700) {
            return 'clubs';
        } else if (x < 875) {
            return 'hearts';
        } else if (x < 1050) {
            return 'spades';
        } else {
            return 'diamonds';
        }

    } else {

        if (x <= 175 && y >= 250) {        
            pile = 0;
        } else if (x <= 350 && y >= 250) { 
            pile = 1;
        } else if (x <= 525 && y >= 250) { 
            pile = 2;
        } else if (x <= 700 && y >= 250) { 
            pile = 3;
        } else if (x <= 875 && y >= 250) { 
            pile = 4;
        } else if (x <= 1050 && y >= 250) {
            pile = 5;
        } else if (x <= 1250 && y >= 250) {
            pile = 6;
        } else {
            pile = currPile;
        }
    }

    return pile;
}

function particle(color: number, parent: PIXI.Container) {
    const sq = new PIXI.Graphics();
    sq.beginFill(0xffffff);
    sq.drawRect(0, 0, 6, 6);
    sq.endFill();
    sq.pivot.set(3, 3);

    gsap.fromTo(sq, {pixi: {scale: 0}}, {pixi: {x: 'random(-100, 100)', y: 'random(-100, 100)', rotation: 1440, scale: 3}, duration: 2});
    gsap.to(sq, {pixi: {tint: color}, duration: 1});
    gsap.to(sq, {pixi: {tint: 0}, duration: 1, delay: 1});

    parent.addChild(sq);
}

export function firework(x: number, y: number, color: number) {
    const container = new PIXI.Container();
    container.position.set(x, y);

    for (let i = 0; i < 50; i++) {
        particle(color, container);
    }

    gsap.to(container, {pixi: {y: y + 100}, duration: 2, ease: 'power2.in', onComplete: () => {container.destroy()} });

    return container;
}