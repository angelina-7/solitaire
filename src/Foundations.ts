import * as PIXI from 'pixi.js';
import { Card } from './Card';
import { IFoundationContainer, Suits } from './util';

export class Foundations extends PIXI.Container {

    constructor(public state, private foundationsInfo: string[][], private allCards) {
        super();

        this.sortableChildren = true;

        for (let i = 0; i < 4; i++) {
            let color = this.foundationsInfo[i][0];
            let src = this.foundationsInfo[i][1];
            const container: IFoundationContainer = new PIXI.Container() as IFoundationContainer;
            container.sortableChildren = true;
            container.color = color;

            const fnd = new PIXI.Graphics();
            fnd.beginFill(0xeeeeee);
            fnd.drawRoundedRect(0, 0, 120, 180, 10);
            fnd.endFill();

            const picture = PIXI.Sprite.from(src);
            picture.width = 100;
            picture.height = 130;
            picture.anchor.set(0.5);
            picture.position.set(60, 90);

            container.addChild(fnd, picture);
            container.position.set(555 + i * 175, 70);

            for (let i = 0; i < state[color].cards.length; i++) {
                let cardInfo = state[color].cards[i];

                let card = new Card();
                card.location = color;
                card.zIndex = i;
                card.suit = Suits[cardInfo.suit];
                card.rank = cardInfo.face - 1;
                card.pilePos = color;
                card.interactive = false;

                card.position.set(60,90)
                container.addChild(card);

                let cardFace = this.allCards.find(x => x.suit == card.suit && x.rank == card.rank);

                card.addFace(cardFace);
                card.flip();
            }

            this.addChild(container);
        }
        // this.interactive = true;
        // this.on('pointerdown', () => {
        //     console.log(this)
        // })
    }


}