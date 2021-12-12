export class Border {
    constructor(ctx, path) {
        if (!path || path.length < 2) {
            throw new Error('Path should contains at least 2 points.');
        }

        this.path = path;

        this._ctx = ctx;
        this._path2d = new Path2D();

        const startPoint = path[0];
        this._path2d.moveTo(startPoint.x, startPoint.y);

        for(let i = 1; i < path.length; i++) {
            this._path2d.lineTo(path[i].x, path[i].y);
        }

        this._path2d.closePath();
    }

    contains(point) {
        return this._ctx.isPointInPath(this._path2d, point.x, point.y);
    }
}
