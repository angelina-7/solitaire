import * as PIXI from 'pixi.js';
import { IFoundationContainer } from './util';

export class Foundations extends PIXI.Container {

    constructor(private foundationsInfo: string[][]) {
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
            container.position.set(555 + i * 175, 30);

            this.addChild(container);
        }
        // this.interactive = true;
        // this.on('pointerdown', () => {
        //     console.log(this)
        // })
    }


}