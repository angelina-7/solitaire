import * as PIXI from "pixi.js";

export enum SuitName {
    clubs, hearts, spades, diamonds
}

export enum Rank {
    ace, _2, _3, _4, _5, _6, _7, _8, _9, _10, jack, queen, king
}

export function getSuit(sheet: PIXI.BaseTexture, name: SuitName): Array<PIXI.Container> {
    const result = new Array<PIXI.Container>();
    console.log(name)
    const resultObj = {};
    window['resultObj'] = resultObj

    resultObj[name] = new Array<PIXI.Container>();

    for (let i = 0; i < 13; i++) {
        const container = new PIXI.Container();
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(0, 0, 404, 618, 34);
        mask.endFill();

        const border = new PIXI.Graphics();
        border.lineStyle({ width: 4, color: 0x000000 });
        border.drawRoundedRect(0, 0, 404, 617, 34);

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

export interface ICards {
    'c': PIXI.Container[],
    'h': PIXI.Container[],
    's': PIXI.Container[],
    'd': PIXI.Container[],
}


export function getCards(sheet: PIXI.BaseTexture) {
    const colors = ['c', 'h', 's', 'd'];

    const result = {};

    result['c'] = new Array<PIXI.Container>();
    result['h'] = new Array<PIXI.Container>();
    result['s'] = new Array<PIXI.Container>();
    result['d'] = new Array<PIXI.Container>();

    for (let i = 0; i < 13; i++) {
        for (let color = 0; color < 4; color++) {

            const container = new PIXI.Container();
            const mask = new PIXI.Graphics();
            mask.beginFill(0xffffff);
            mask.drawRoundedRect(0, 0, 404, 618, 34);
            mask.endFill();

            const border = new PIXI.Graphics();
            border.lineStyle({ width: 4, color: 0x000000 });
            border.drawRoundedRect(0, 0, 404, 617, 34);

            const cardTexture = new PIXI.Texture(sheet, new PIXI.Rectangle(50 + (i * 458), 850 + (color * 660), 404, 618));
            const card = PIXI.Sprite.from(cardTexture);
            card.mask = mask;

            container.addChild(card, mask, border);
            container.pivot.set(204, 0)
            container.scale.set(0.3);

            result[colors[color]].push(container);
        }
    }

    return result;
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