export class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this._x2 = this.x + width;
        this._y2 = this.y + height;
    }

    contains(point) {
        return point.x >= this.x && point.x <= this._x2 && point.y > this.y && point.y < this._y2;
    }
}
