import { Point } from './point.js';

export class HexagonNeighbours {
    constructor() {
        this.topLeft = null;
        this.top = null;
        this.topRight = null;
        this.bottomRight = null;
        this.bottom = null;
        this.bottomLeft = null;
    }

    get items() {
        return Object.keys(this).map(key => {
            return this[key];
        }).filter(item => item && item !== -1);
    }

    getRelativePosition(key, radius) {
        const h = Math.sqrt(Math.pow(radius,2)-Math.pow(radius/2,2));
        switch(key) {
            case 'topLeft':
                return new Point(-1.5*radius, -h);
            case 'top':
                return new Point(0, -2*h);
            case 'topRight':
                return new Point(1.5*radius, -h);
            case 'bottomRight':
                return new Point(1.5*radius, h);
            case 'bottom':
                return new Point(0, 2*h);
            case 'bottomLeft':
                return new Point(-1.5*radius, h);
            default:
                new Error(`Unknown position: ${key}`);
        }
    }

    getOppositeKey(key) {
        switch(key) {
            case 'topLeft':
                return 'bottomRight';
            case 'top':
                return 'bottom';
            case 'topRight':
                return 'bottomLeft';
            case 'bottomRight':
                return 'topLeft';
            case 'bottom':
                return 'top';
            case 'bottomLeft':
                return 'topRight';
            default:
                new Error(`Unknown position: ${key}`);
        }
    }
}
