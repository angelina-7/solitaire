import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

import { clubsF, diamondsF, heartsF, spadesF, getCardBack, getPileByPos, getPilePosX, ICardContainer, Rank, SuitName } from './util';
import { Piles } from './Piles';
import { Deck } from './Deck';
import { canPlaceCard } from './rules';
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

    //basically all game rules are down here xD
    public select(piles: Piles, deck: Deck, x: number, y: number) {
        if (this.fasingUp) {
            if (!deck.revealedPack.includes(this)) {
                //check if multiple selected
                let [col, row] = this.pilePos.split('-').map(x => Number(x));
                let len = piles.pilesState[col].length - 1;
                if (len > row) {
                    this.moving = true;
                    let nextCards = piles.pilesState[col].slice(row);

                    nextCards.forEach((c, i) => {
                        c.zIndex = 20;
                        gsap.to(c, { pixi: { x: x - 90, y: y + ((i - 1) * 40), scale: 1.1 }, duration: 0.3, ease: 'back.in(1.7)' });
                    });
                    return nextCards;
                } else {
                    //single select from pile
                    this.zIndex = 20;
                    this.moving = true;
                    gsap.to(this, { pixi: { x: x - 90, y: y - 40, scale: 1.1 }, duration: 0.3, ease: 'back.in(1.7)' });
                }
            } else {
                //select from deck
                this.moving = true;
                gsap.to(this, { pixi: { x: x - 90, y: y - 40, scale: 1.1 }, duration: 0.3, ease: 'back.in(1.7)' });
            }
            return null;
        }
    }

    public move(x: number, y: number, selected?: Card[]) {
        if (this.moving) {
            if (selected) {
                selected.forEach((c, i) => {
                    c.position.set(x - 90, y + ((i - 1) * 40))
                })
            } else {
                this.position.set(x - 90, y - 40)
            }
        }
    }

    public place(piles: Piles, deck: Deck, foundations: Foundations, shuffledDeck: ICardContainer[], x: number, y: number, selected?: Card[]) {
        if (this.moving) {
            let initX = 175;
            let initY = 0;
            let currPile: any = this.pilePos;
            let newPile = getPileByPos(x, y);

            //initail x, y position of card to return back, if user tries to place it agains the rules
            let [col, row] = [-1, -1];
            if (piles.pack.includes(this)) {
                [col, row] = this.pilePos.split('-').map(x => Number(x));
                currPile = col;
                initX = getPilePosX(col);
                initY = 200 + ((row) * 40);
            }

            if (typeof newPile == 'number') {
                let newPileLI = piles.pilesState[newPile].length - 1;
                let newPosLastCard = piles.pilesState[newPile][newPileLI];

                if (newPosLastCard) {
                    if (col != -1) {
                        if (selected) {
                            this.placeMultipleFromPileToPile(selected, piles, newPile, newPileLI, newPosLastCard, initX, initY, col, row, shuffledDeck)
                        } else {
                            this.placeCardFromPileToPile(piles, newPile, newPileLI, newPosLastCard, initX, initY, col, row, shuffledDeck)
                        }
                    } else {
                        this.placeCardFromDeckToPile(deck, piles, newPile, newPileLI, newPosLastCard, initX, initY)
                    }
                } else if (this.rank == Rank.king) {
                    //place king on empthy pile
                    this.placeCardInNewPile(deck, piles, newPile, newPileLI, newPosLastCard, initX, initY, col, row, shuffledDeck);
                } else {
                    //on empthy pile you cannot place any other than king
                    gsap.to(this, { pixi: { x: initX, y: initY, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                }
            } else if (y <= 200 && x <= 350 && deck.revealedPack.includes(this)) {
                //return back to deck if user decides to drop it back
                gsap.to(this, { pixi: { x: initX, y: initY, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
            } else if (typeof newPile == 'string') {
                this.placeCardToFoundation(newPile, piles, deck, foundations, currPile, col, row, shuffledDeck);
            }
            this.moving = false;
        }

    }

    placeCardFromDeckToPile(
        deck: Deck, piles: Piles, newPile: number, newPileLI: number, newPosLastCard: Card, initX: number, initY: number, skip?: boolean
    ) {
        if (skip || canPlaceCard(this, newPosLastCard)) {
            deck.revealedPack.pop();
            deck.removeChild(this);

            piles.pack.push(this);
            piles.addChild(this);

            piles.pilesState[newPile].push(this);
            this.pilePos = `${newPile}-${newPileLI + 1}`

            this.zIndex = 1;
            gsap.to(this, { pixi: { x: getPilePosX(newPile), y: 200 + ((newPileLI + 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
        } else {
            gsap.to(this, { pixi: { x: initX, y: initY, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
        }
        this.moving = false;
    }

    placeMultipleFromPileToPile(
        selected: Card[], piles: Piles, newPile: number, newPileLI: number, newPosLastCard: Card,
        initX: number, initY: number, col: number, row: number, shuffledDeck: ICardContainer[]
    ) {
        if (canPlaceCard(this, newPosLastCard)) {
            piles.pilesState[col].splice(row, selected.length);
            selected.forEach((c, i) => {
                c.zIndex = 1;
                piles.pilesState[newPile].push(c);
                c.pilePos = `${newPile}-${newPileLI + i}`

                gsap.to(c, { pixi: { x: getPilePosX(newPile), y: 200 + ((newPileLI + 1 + i) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
            })

            let prevCard = piles.pilesState[col][row - 1];
            if ((col != (newPile)) && prevCard && !prevCard.fasingUp) {
                piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
            }
        } else {
            selected.forEach((c, i) => {
                c.zIndex = 1;
                gsap.to(c, { pixi: { x: initX, y: initY + (i * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
            })
        }
        this.moving = false;
    }

    placeCardFromPileToPile(
        piles: Piles, newPile: number, newPileLI: number, newPosLastCard: Card,
        initX: number, initY: number, col: number, row: number, shuffledDeck: ICardContainer[], skip?: boolean
    ) {
        this.zIndex = 1;
        if (skip || canPlaceCard(this, newPosLastCard)) {
            piles.pilesState[col].splice(row, 1);

            let prevCard = piles.pilesState[col][row - 1];
            if ((col != (newPile)) && prevCard && !prevCard.fasingUp) {
                piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
            }

            piles.pilesState[newPile].push(this);
            this.pilePos = `${newPile}-${newPileLI + 1}`

            gsap.to(this, { pixi: { x: getPilePosX(newPile), y: 200 + ((newPileLI + 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
        } else {
            gsap.to(this, { pixi: { x: initX, y: initY, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
        }
        this.moving = false;
    }

    placeCardInNewPile(
        deck: Deck, piles: Piles, newPile: number, newPileLI: number, newPosLastCard: Card,
        initX: number, initY: number, col: number, row: number, shuffledDeck: ICardContainer[]
    ) {
        if (col != -1) {
            this.placeCardFromPileToPile(piles, newPile, newPileLI, newPosLastCard, initX, initY, col, row, shuffledDeck, true)
        } else {
            this.placeCardFromDeckToPile(deck, piles, newPile, newPileLI, newPosLastCard, initX, initY, true)
        }
    }

    placeCardToFoundation(newPile: string, piles: Piles, deck: Deck, foundations: Foundations, currPile: number, col: number, row: number, shuffledDeck: ICardContainer[]) {
        if (newPile == 'clubs') {
            if (this.suit == SuitName.clubs && this.rank == clubsF[0]) {
                clubsF.shift();
                this.zIndex = -10;
                this.pilePos = 'foundation';
                gsap.to(this, { pixi: { x: 615, y: 120, scale: 1, zIndex: -clubsF.length }, duration: 0.3, ease: 'back.out(1.7)' });

                if (col != -1) {
                    piles.pilesState[col].splice(row, 1);
                    piles.removeChild(this);
                    let cardToRemoveIndex = piles.pack.findIndex(x => x == this);
                    piles.pack.splice(cardToRemoveIndex, 1)
                    let prevCard = piles.pilesState[col][row - 1];
                    if (prevCard && !prevCard.fasingUp) {
                        piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
                    }
                } else {
                    deck.revealedPack.pop();
                    deck.removeChild(this);
                }
                foundations.addChild(this)
            } else {
                if (this.pilePos == 'deal') {
                    gsap.to(this, { pixi: { x: 175, y: 0, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                } else {
                    gsap.to(this, { pixi: { x: getPilePosX(currPile), y: 200 + ((piles.pilesState[currPile].length - 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                }
            }
        } else if (newPile == 'hearts') {
            if (this.suit == SuitName.hearts && this.rank == heartsF[0]) {
                heartsF.shift();
                this.zIndex = -10;
                this.pilePos = 'foundation';
                gsap.to(this, { pixi: { x: 790, y: 120, scale: 1, zIndex: -heartsF.length }, duration: 0.3, ease: 'back.out(1.7)' });

                if (col != -1) {
                    piles.pilesState[col].splice(row, 1);
                    piles.removeChild(this);
                    let cardToRemoveIndex = piles.pack.findIndex(x => x == this);
                    piles.pack.splice(cardToRemoveIndex, 1)
                    let prevCard = piles.pilesState[col][row - 1];
                    if (prevCard && !prevCard.fasingUp) {
                        piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
                    }
                } else {
                    deck.revealedPack.pop();
                    deck.removeChild(this);
                }
                foundations.addChild(this)
            } else {
                if (this.pilePos == 'deal') {
                    gsap.to(this, { pixi: { x: 175, y: 0, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                } else {
                    gsap.to(this, { pixi: { x: getPilePosX(currPile), y: 200 + ((piles.pilesState[currPile].length - 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                }
            }
        } else if (newPile == 'spades') {
            if (this.suit == SuitName.spades && this.rank == spadesF[0]) {
                spadesF.shift();
                this.zIndex = -10;
                this.pilePos = 'foundation';
                gsap.to(this, { pixi: { x: 965, y: 120, scale: 1, zIndex: -spadesF.length }, duration: 0.3, ease: 'back.out(1.7)' });

                if (col != -1) {
                    piles.pilesState[col].splice(row, 1);
                    piles.removeChild(this);
                    let cardToRemoveIndex = piles.pack.findIndex(x => x == this);
                    piles.pack.splice(cardToRemoveIndex, 1)
                    let prevCard = piles.pilesState[col][row - 1];
                    if (prevCard && !prevCard.fasingUp) {
                        piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
                    }
                } else {
                    deck.revealedPack.pop();
                    deck.removeChild(this);
                }
                foundations.addChild(this)
            } else {
                if (this.pilePos == 'deal') {
                    gsap.to(this, { pixi: { x: 175, y: 0, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                } else {
                    gsap.to(this, { pixi: { x: getPilePosX(currPile), y: 200 + ((piles.pilesState[currPile].length - 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                }
            }
        } else if (newPile == 'diamonds') {
            if (this.suit == SuitName.diamonds && this.rank == diamondsF[0]) {
                diamondsF.shift();
                this.zIndex = -10;
                this.pilePos = 'foundation';
                gsap.to(this, { pixi: { x: 1140, y: 120, scale: 1, zIndex: -diamondsF.length }, duration: 0.3, ease: 'back.out(1.7)' });

                if (col != -1) {
                    piles.pilesState[col].splice(row, 1);
                    piles.removeChild(this);
                    let cardToRemoveIndex = piles.pack.findIndex(x => x == this);
                    piles.pack.splice(cardToRemoveIndex, 1)
                    let prevCard = piles.pilesState[col][row - 1];
                    if (prevCard && !prevCard.fasingUp) {
                        piles.reveal(`${col}-${row - 1}`, shuffledDeck.pop())
                    }
                } else {
                    deck.revealedPack.pop();
                    deck.removeChild(this);
                }
                foundations.addChild(this)
            } else {
                if (this.pilePos == 'deal') {
                    gsap.to(this, { pixi: { x: 175, y: 0, scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                } else {
                    gsap.to(this, { pixi: { x: getPilePosX(currPile), y: 200 + ((piles.pilesState[currPile].length - 1) * 40), scale: 1 }, duration: 0.3, ease: 'back.out(1.7)' });
                }
            }

        }


    }
}