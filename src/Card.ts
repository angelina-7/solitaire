import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export class Card extends PIXI.Container {
    public face = new PIXI.Container();
    public back = new PIXI.Container();
    public fasingUp = false;
    public draggable = false;
    public rank = null;
    public suit = null;
    private _pilePos = null;

    constructor() {
        super();

        this.addBack();
        this.pivot.set(this.width / 2, this.height / 2);

        this.interactive = true;

        this.on('pointerdown', (e) => {
            // if (this instanceof Card) {
            //     e.stopPropagation();
            // }
            // console.log(this instanceof Piles)
        })
    }

    get pilePos() {
        return this._pilePos
    }

    set pilePos(position: string) {
        this._pilePos = position;
    }

    protected addBack() {
        const cardBack = PIXI.Sprite.from('assets/card-back.jpeg');
        cardBack.scale.set(0.2);

        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(0, 0, 120, 183, 12);
        mask.endFill();

        cardBack.mask = mask;

        const border = new PIXI.Graphics();
        border.lineStyle({ width: 2, color: 0x000000 });
        border.drawRoundedRect(0, 0, 120, 183, 12);

        this.back.addChild(cardBack, mask, border);
        this.addChild(this.back);
    }

    public addFace(face: PIXI.Container) {
        this.face.pivot.set(- this.width / 2, 1);
        this.face.addChild(face);
    }

    public flip() {
        const tl = gsap.timeline();
        tl.to(this, { pixi: { scale: 1.05 }, yoyo: true, duration: 0.3, repeat: 1, ease: 'none' })
        tl.to(this, {
            pixi: { scaleX: 0 }, yoyo: true, duration: 0.3, repeat: 1, ease: 'none', onRepeat: () => {
                if (this.fasingUp) {
                    this.fasingUp = false;
                    this.removeChildren();
                    this.addBack();
                } else {
                    this.fasingUp = true;
                    this.removeChildren();
                    this.addChild(this.face);

                }
            }
        }, '<')
    }
}