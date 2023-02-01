import { Card } from "./Card";
import { SuitName } from "./util";

export function canPlaceCard(topCard: Card, bottomCard: Card) {
    if (topCard.rank + 1 == bottomCard.rank) {
        if ((topCard.suit == SuitName.hearts || topCard.suit == SuitName.diamonds)
            && (bottomCard.suit == SuitName.clubs || bottomCard.suit == SuitName.spades)) {
            return true;
        }
        if ((bottomCard.suit == SuitName.hearts || bottomCard.suit == SuitName.diamonds)
            && (topCard.suit == SuitName.clubs || topCard.suit == SuitName.spades)) {
            return true
        }
    }
    return false;
}

//todo foundation place rule