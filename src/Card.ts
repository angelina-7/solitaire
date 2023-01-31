import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { getCardBack, getPileByPos, getPilePosX } from './util';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export class Card extends PIXI.Container {
    public face = new PIXI.Container();
    public back = new PIXI.Container();
    public fasingUp = false;
    public draggable = false;
    public rank = null;
    public suit = null;
    private moving = false;
    private _pilePos = null;

    constructor() {
        super();

        this.back = getCardBack();
        this.addBack();

        this.pivot.set(this.width / 2, this.height / 2);

        this.interactive = true;

        // this.on('pointerdown', (e) => {
        //     if (this instanceof Card) {
        //         e.stopPropagation();
        //     }
        //     console.log(this instanceof Piles)
        // })
    }

    get pilePos() {
        return this._pilePos
    }

    set pilePos(position: string) {
        this._pilePos = position;
    }

    protected addBack() {
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

    public move(pileState: Card[][]) {
        this.on('pointerdown', (e) => {
            //todo move pile of cards

            this.zIndex = 20;
            gsap.to(this, { pixi: { x: e.globalX - 90, y: e.globalY - 40, scale: 1.1 }, duration: 0.3, ease: 'back.in(1.7)' })
            this.moving = true;

        });

        this.on('pointermove', (e) => {
            if (this.moving) {
                this.position.set(e.globalX - 90, e.globalY - 40)
            }
        });

        this.on('pointerup', (e) => {
            this.moving = false;
            let [col, row] = this.pilePos.split('-');

            let newPile = getPileByPos(e.globalX);
            pileState[+col - 1].splice(+row - 1, 1);
            pileState[newPile].push(this);
            this.pilePos = `${newPile + 1}-${pileState[newPile].length}`


            this.zIndex = 10;
            gsap.to(this, { pixi: { x: getPilePosX(newPile), y: 200 + ((pileState[newPile].length - 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' })

            //todo reveal card under

        });

    }
}