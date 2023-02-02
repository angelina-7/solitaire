import * as PIXI from "pixi.js";

export interface ICardContainer extends PIXI.Container {
    suit: string;
    rank: string;
}

export interface IFoundationContainer extends PIXI.Container {
    color: string;
}

export interface ICards {
    'c': PIXI.Container[],
    'h': PIXI.Container[],
    's': PIXI.Container[],
    'd': PIXI.Container[],
}

export enum SuitName {
    clubs, hearts, spades, diamonds
}

export const spadesF = ['ace', '_2', '_3', '_4', '_5', '_6', '_7', '_8', '_9', '_10', 'jack', 'queen', 'king'];
export const heartsF = ['ace', '_2', '_3', '_4', '_5', '_6', '_7', '_8', '_9', '_10', 'jack', 'queen', 'king'];
export const clubsF = ['ace', '_2', '_3', '_4', '_5', '_6', '_7', '_8', '_9', '_10', 'jack', 'queen', 'king'];
export const diamondsF = ['ace', '_2', '_3', '_4', '_5', '_6', '_7', '_8', '_9', '_10', 'jack', 'queen', 'king'];

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

export function getSuit(sheet: PIXI.BaseTexture, name: SuitName): Array<PIXI.Container> {
    const result = new Array<PIXI.Container>();
    console.log(name)
    const resultObj = {};
    window['resultObj'] = resultObj

    resultObj[name] = new Array<PIXI.Container>();

    for (let i = 0; i < 13; i++) {
        const container: ICardContainer = new PIXI.Container() as ICardContainer;
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(0, 0, 404, 618, 34);
        mask.endFill();

        container.suit = SuitName[name]
        container.rank = Rank[i];

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
        resultObj[name].push(container);
    }

    console.log('result', resultObj)
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
    } else if (pile == 2){
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
    console.log(x, y)
    let pile: number;

    if (y < 210) {
        if (x < 450) {
            return 'deal';
        } else if (x < 700){
            console.log('clubs foundation');
            return 'clubs';
        } else if (x < 875) {
            console.log('hearts foundation');
            return 'hearts';
        } else if (x < 1050) {
            console.log('spades foundation');
            return 'spades';
        } else {
            console.log('diamonds foundation');
            return 'diamonds';
        }

    } else {
    
        if (x <= 175 && y >= 210) {         //
            pile = 0;
        } else if (x <= 350 && y >= 210) {  //
            pile = 1;   
        } else if (x <= 525 && y >= 210) {  //
            pile = 2;
        } else if (x <= 700 && y >= 210) {  //
            pile = 3;
        } else if (x <= 875 && y >= 210) {  //
        pile = 4;
        } else if (x <= 1050 && y >= 210) { //
            pile = 5;
        } else if (x <= 1250 && y >= 210) { //
            pile = 6;
        } else {
            pile = currPile;
        }
    }
    
    console.log(pile)

    return pile;
}