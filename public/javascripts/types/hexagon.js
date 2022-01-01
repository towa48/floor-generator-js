import { HexagonNeighbours } from './hexagon-neighbours.js';
import { Point } from './point.js';
import { ColorGroup } from './color-group.js';
import { getRandomInt } from '../utils/random.js';
import { colors } from '../const.js';

export class Hexagon {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.halfRadius = radius/2;
        this.height = Math.sqrt(Math.pow(radius,2)-Math.pow(this.halfRadius,2));

        this.neighbours = new HexagonNeighbours();

        this.colorGroup = null;
        this.texture = null;
    }

    draw(ctx) {
        ctx.beginPath();

        ctx.moveTo(this.x + this.radius, this.y);
        ctx.lineTo(this.x + this.halfRadius, this.y + this.height);
        ctx.lineTo(this.x - this.halfRadius, this.y + this.height);
        ctx.lineTo(this.x - this.radius, this.y);
        ctx.lineTo(this.x - this.halfRadius, this.y - this.height);
        ctx.lineTo(this.x + this.halfRadius, this.y - this.height);
        ctx.closePath();

        ctx.fillStyle = this.texture || colors.red;
        ctx.fill();
    }

    update(ctx) {
        this.draw(ctx)
    }

    contains(point) {
        const p1 = new Point(this.x-this.halfRadius, this.y-this.height);
        const p2 = new Point(this.x+this.halfRadius, this.y+this.height);
        if (point.x >= p1.x && point.x <= p2.x && point.y > p1.y && point.y < p2.y) {
            return true;
        }

        // TODO:
        return false;
    }

    setTexture(colorGroup, textures) {
        if (!colorGroup || !textures) {
            throw new Error('Unknown color group');
        }

        this.colorGroup = colorGroup;
        this.texture = textures[this.colorGroup.colorIndex];
        this.colorGroup.members.push(this);
    }

    findAllNeighbours(objects, border) {
        Object.keys(this.neighbours).forEach(key => {
            if (this.neighbours[key] || this.neighbours[key] === -1) {
                return;
            }

            const relativePosition = this.neighbours.getRelativePosition(key, this.radius);
            const position = new Point(this.x + relativePosition.x, this.y + relativePosition.y);
            if (!border.contains(position)) {
                this.neighbours[key] = -1;
                return;
            }

            const exists = objects.filter(item => item.contains(position));
            const found = exists.length > 0 ? exists[0] : null;
            if (!found) {
                return;
            }

            this.neighbours[key] = found;
        });
    }

    spawn(objects, border, textures, maxObjects, maxInlineColors, refresh) {
        if (objects.length >= maxObjects) {
            console.log('Stack exceeded');
            return;
        }

        Object.keys(this.neighbours).forEach(key => {
            if (this.neighbours[key] || this.neighbours[key] === -1) {
                return;
            }

            const relativePosition = this.neighbours.getRelativePosition(key, this.radius);
            const position = new Point(this.x + relativePosition.x, this.y + relativePosition.y);
            if (!border.contains(position)) {
                this.neighbours[key] = -1;
                return;
            }

            // check any existing item at that position
            const exists = objects.filter(item => item.contains(position));
            const found = exists.length > 0 ? exists[0] : null;
            if (found) {
                // TODO: any color check?
                this.neighbours[key] = found;
                return;
            }

            const hexagon = new Hexagon(position.x, position.y, this.radius);
            this.neighbours[key] = hexagon;
            const oppositeKey = this.neighbours.getOppositeKey(key);
            hexagon.neighbours[oppositeKey] = this;

            // find all neighbours before color
            hexagon.findAllNeighbours(objects, border);

            let newColor = getRandomInt(0, textures.length-1);
            let violate = true;
            let i = 1;
            while(violate && i <= textures.length) {
                violate = this.isColorViolate(hexagon, newColor, maxInlineColors);

                if (violate) {
                    newColor = newColor + 1;
                    if (newColor > textures.length-1) {
                        newColor = 0;
                    }

                    i++;
                }
            }

            if (violate) {
                hexagon.setTexture(new ColorGroup(-1), textures);
            } else {
                // concat neighbours color group
                const neighboursWithColor = hexagon.neighbours.items.filter(item => item.colorGroup.colorIndex == newColor);
                const colorGroup = new ColorGroup(newColor);
                const allMembers = neighboursWithColor.reduce((prev, current) => {
                    return prev.concat(current.colorGroup.members);
                }, [hexagon]);

                allMembers.forEach(item => {
                    item.setTexture(colorGroup, textures);
                });
            }

            objects.push(hexagon);
            refresh();

            hexagon.spawn(objects, border, textures, maxObjects, maxInlineColors, refresh);
        });
    }

    isColorViolate(hexagon, colorIndex, maxInlineColors) {
        const same = hexagon.neighbours.items.filter(item => {
            return item.colorGroup.colorIndex == colorIndex;
        });
        const sameOverall = same.reduce((prev, curr) => {
            return prev.concat(curr.colorGroup.members);
        }, []);
        return sameOverall.length >= maxInlineColors;
    }
}