import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

import { getCardBack, getPileByPos, getPilePosX, ICardContainer, Rank, SuitName, IFoundationContainer } from './util';
import { Piles } from './Piles';
import { Deck } from './Deck';
import { canPlaceCard, foundationSuitMatch } from './rules';
import { Foundations } from './Foundations';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export class Card extends PIXI.Container {
    public face = new PIXI.Container();
    public back = new PIXI.Container();
    public fasingUp = false;
    public rank: Rank;
    public suit: SuitName;
    public moving = false;
    public location: string = null;
    public index: any = null;
    private _pilePos = '';
    

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

    public addFace(face: ICardContainer) {
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
                    // console.log(this.pilePos, 'see back');

                } else {
                    this.fasingUp = true;
                    this.removeChildren();
                    this.addChild(this.face);
                    // console.log(this.pilePos, 'see front');

                }
            }
        }, '<')
    }

    //basically all game rules are down here xD
    public select(piles: Piles, deck: Deck, x: number, y: number, overlay: PIXI.Sprite) {
        if (this.fasingUp) {
            this.moving = true;

            let initX = this.x + this.parent.x
            let initY = this.y + this.parent.y            

            overlay.hitArea = new PIXI.Rectangle(0, 0, 1225, 840)

            if (piles.pack.includes(this)) {
                let [col, row] = this.pilePos.split('-').map(x => Number(x));
                let len = piles.pilesState[col].length - 1;

                if (len > row) {
                    //milpile select
                    let nextCards = piles.pilesState[col].slice(row);

                    nextCards.forEach((c, i) => {
                        c.zIndex = 20;
                        this.selectAnimation(c, x, y, initX, initY, i);
                        piles.removeChild(c);
                        overlay.addChild(c);
                    });
                    return nextCards;
                } else {
                    //single select
                    this.zIndex = 20;
                    piles.removeChild(this);
                    overlay.addChild(this);
                    this.selectAnimation(this, x, y, initX, initY);
                }
            }
            else if (deck.revealedPack.includes(this)) {
                //select from deck
                deck.removeChild(this);
                overlay.addChild(this);
                this.selectAnimation(this, x, y, initX, initY);
            }
            return null;

        }
    }

    public move(x: number, y: number, selected?: Card[]) {
        if (this.moving) {
            //bug when moving fast 
            if (selected) {
                selected.forEach((c, i) => {
                    c.position.set(x - 90, y + ((i - 1) * 40))
                })
            } else {
                this.position.set(x, y + 60)
            }
        }
    }

    public place(piles: Piles, deck: Deck, foundations: Foundations, shuffledDeck: ICardContainer[], x: number, y: number, overlay: PIXI.Sprite, selected?: Card[]) {
        if (this.moving) {
            let initX = 0;
            let initY = 0;
            let newPile = getPileByPos(x, y);
            overlay.removeChildren();
            overlay.hitArea = undefined;

            if (piles.pack.includes(this)) {
                piles.addChild(this);
                let [col, row] = this.pilePos.split('-').map(x => Number(x));
                [initX, initY] = this.getInitPosition(col, row);

                if (this.placeToPile(newPile, piles)) {
                    if (selected) {
                        this.multipleFromPile(piles, selected, Number(newPile), col, row, shuffledDeck)
                    } else {
                        this.fromPile(piles, Number(newPile), col, row, shuffledDeck)
                    }
                } else if (this.placeToFoundation(newPile.toString(), foundations)) {
                    this.fromPileToFound(piles, foundations, col, row, shuffledDeck)
                } else {
                    if (selected) {
                        this.returnBackAnimationMultiple(initX, initY, selected);
                    } else {
                        this.zIndex = 1;
                        this.returnBackAnimation(initX, initY);
                    }
                }

            } else if (deck.revealedPack.includes(this)) {                
                deck.addChildAt(this, this.index+1);
                [initX, initY] = [175, 0];

                if (this.placeToPile(newPile, piles)) {
                    this.fromDeck(deck, piles, Number(newPile))
                } else if (this.placeToFoundation(newPile.toString(), foundations)) {
                    this.fromDeckToFound(deck, foundations)
                } else {
                    this.returnBackAnimation(initX, initY)
                }
            }

            this.moving = false;
        }

    }


    private getInitPosition(col: number, row: number): [number, number] {
        let initX = getPilePosX(col);
        let initY = 200 + ((row) * 40);

        return [initX, initY];
    }

    private placeToFoundation(newPile: string, foundations: Foundations) {
        if (foundationSuitMatch(this.suit, newPile)) {
            let foundationPile = foundations.getChildAt(this.suit) as IFoundationContainer;
            let lastCard = foundationPile.getChildAt(foundationPile.children.length - 1);

            if (lastCard instanceof Card) {
                if (lastCard.rank + 1 == this.rank) {
                    foundationPile.addChild(this);
                    return true;
                }
            } else {
                if (this.rank == Rank.ace) {
                    foundationPile.addChild(this);
                    return true;
                }
            }
        }
        return false;
    }

    private fromPileToFound(piles: Piles, foundations: Foundations, col: number, row: number, shuffledDeck: ICardContainer[]) {
        piles.pilesState[col].splice(row, 1);
        this.pilePos = 'foundation';

        let cardToRemoveIndex = piles.pack.indexOf(this);
        piles.pack.splice(cardToRemoveIndex, 1);

        piles.removeChild(this);
        this.removeAllListeners();

        this.revealCardUnder(piles, col, row, shuffledDeck);
        this.toFoundAnimation(foundations);
    }

    private fromDeckToFound(deck, foundations) {
        deck.revealedPack.pop();
        deck.removeChild(this);

        this.toFoundAnimation(foundations);
    }


    private placeToPile(newPile: string | number, piles: Piles): boolean {
        if (typeof newPile == 'number') {
            let newPileLI = piles.pilesState[newPile].length - 1;
            let newPosLastCard = piles.pilesState[newPile][newPileLI];

            if (newPosLastCard) {
                if (canPlaceCard(this, newPosLastCard)) {
                    return true;
                }
            } else {
                if (this.rank == Rank.king) {
                    return true;
                }
            }
        }
        return false;
    }

    private fromPile(piles: Piles, newPile: number, col: number, row: number, shuffledDeck: ICardContainer[]) {
        let newPileLI = piles.pilesState[newPile].length - 1;

        piles.pilesState[col].splice(row, 1);

        piles.pilesState[newPile].push(this);
        this.pilePos = `${newPile}-${newPileLI + 1}`

        if ((col != (newPile))) {
            this.revealCardUnder(piles, col, row, shuffledDeck)
        }

        this.placeAnimation(newPile, newPileLI);
    }

    private multipleFromPile(piles: Piles, selected: Card[], newPile: number, col: number, row: number, shuffledDeck: ICardContainer[]) {
        let newPileLI = piles.pilesState[newPile].length;

        piles.pilesState[col].splice(row, selected.length);

        selected.forEach((c, i) => {
            piles.pilesState[newPile].push(c);
            c.pilePos = `${newPile}-${newPileLI + i}`
            this.placeAnimationMultiple(c, newPile, newPileLI, i);
        })

        if ((col != (newPile))) {
            this.revealCardUnder(piles, col, row, shuffledDeck)
        }
    }

    private fromDeck(deck: Deck, piles: Piles, newPile: number) {
        let newPileLI = piles.pilesState[newPile].length - 1;

        deck.revealedPack.pop();
        deck.removeChild(this);

        piles.pack.push(this);
        piles.addChild(this);

        piles.pilesState[newPile].push(this);
        this.pilePos = `${newPile}-${newPileLI + 1}`

        this.placeAnimation(newPile, newPileLI);
    }

    private revealCardUnder(piles: Piles, col: number, row: number, shuffledDeck: ICardContainer[]) {
        let prevCard = piles.pilesState[col][row - 1];
        if (prevCard && !prevCard.fasingUp) {
            piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
        }
    }

    private placeAnimation(newPile, newPileLI) {
        this.placeAnimationMultiple(this, newPile, newPileLI, 1);
    }

    private placeAnimationMultiple(card: Card, newPile: number, newPileLI: number, i: number) {
        card.zIndex = 1;
        gsap.to(card, { pixi: { x: getPilePosX(newPile), y: 200 + ((newPileLI + i) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
    }

    private returnBackAnimation(initX: number, initY: number) {
        gsap.to(this, { pixi: { x: initX, y: initY, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
    }

    private returnBackAnimationMultiple(initX: number, initY: number, selected: Card[]) {
        selected.forEach((c, i) => {
            c.zIndex = 1;
            if (i != 0) {
                let [col, row] = c.pilePos.split('-').map(x => Number(x));
                [initX, initY] = this.getInitPosition(col, row);
            }
            gsap.to(c, { pixi: { x: initX, y: initY, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
        })
    }

    private toFoundAnimation(foundations) {
        let zIndex = foundations.getChildAt(this.suit).children.length;
        gsap.to(this, { pixi: { x: 60, y: 90, scale: 1, zIndex }, duration: 0.3, ease: 'back.out(1.7)' });
    }

    private selectAnimation(card: Card, x: number, y: number, initX: number, initY: number, i?: number) {
        y = y + 60
        if (i >= 1) {
            y = y + (i * 40);
        }
        gsap.fromTo(card, {pixi: {x: initX, y: initY}}, { pixi: { x: x, y, scale: 1.1 }, duration: 0.3, ease: 'back.in(1.7)' });
    }
}