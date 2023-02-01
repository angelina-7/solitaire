import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { getCardBack, getPileByPos, getPilePosX } from './util';
import { Piles } from './Piles';
import { Deck } from './Deck';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export class Card extends PIXI.Container {
    public face = new PIXI.Container();
    public back = new PIXI.Container();
    public fasingUp = false;
    public draggable = false;
    public rank = null;
    public suit = null;
    public moving = false;
    private _pilePos = null;

    constructor() {
        super();

        this.back = getCardBack();
        this.addBack();

        this.pivot.set(this.width / 2, this.height / 2);

        this.interactive = true;
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

    public move(shuffledDeck, piles: Piles, deck?: Deck) {
            this.on('pointerdown', (e) => {
                //todo move pile of cards
                this.moving = true;
                this.zIndex = 20;
                gsap.to(this, { pixi: { x: e.globalX - 90, y: e.globalY - 40, scale: 1.1 }, duration: 0.3, ease: 'back.in(1.7)' });

                console.log(this);
            });

            this.on('pointermove', (e) => {
                if (this.moving) {
                    this.position.set(e.globalX - 90, e.globalY - 40)
                }
            });

            this.on('pointerup', (e) => {
                this.moving = false;
                this.zIndex = 10;
                let newPile = getPileByPos(e.globalX);

                if (piles.pack.includes(this)) {
                    let [col, row] = this.pilePos.split('-');
                    piles.pilesState[+col - 1].splice(+row - 1, 1);
                
                    let prevCard = piles.pilesState[+col - 1][+row - 2]
                    if ((+col != (newPile+1)) && prevCard && !prevCard.fasingUp) {
                        piles.reveal(`${col}-${+row - 1}`, shuffledDeck, shuffledDeck.pop())
                    }
                } else {
                    deck.revealedPack.pop();
                    deck.removeChild(this);

                    piles.pack.push(this);
                    piles.addChild(this);

                }

                piles.pilesState[newPile].push(this);
                this.pilePos = `${newPile + 1}-${piles.pilesState[newPile].length}`

                gsap.to(this, { pixi: { x: getPilePosX(newPile), y: 200 + ((piles.pilesState[newPile].length - 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
            });
    }
}