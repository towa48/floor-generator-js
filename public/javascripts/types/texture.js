export class Texture {
    constructor(source) {
        this.source = source;
        this.pattern = null;
        this.image = null;
    }

    load(ctx) {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = this.source;
            image.onload = () => {
                this.image = image;
                this.pattern = ctx.createPattern(image, "repeat")
                resolve(this.pattern);
            }
        });
    }
}
