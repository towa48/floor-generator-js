import { ColorGroup } from './color-group.js';
import { Hexagon } from './hexagon.js';

export class Storage {
    constructor(params) {
        this.objects = [];
        this.params = params;
    }

    clear() {
        this.objects = [];
        this.params.settings.generated = {};
    }

    push(item, border) {
        this.objects.push(item);

        const generated = this.params.settings.generated;
        if (!generated[border.name]) {
            generated[border.name] = [];
        }
        generated[border.name].push(item.toSave());
    }

    load(ctx, textures) {
        this.objects = [];
        const generated = this.params.settings.generated;
        const borders = this.params.getBorders(ctx);
        Object.keys(generated).forEach(key => {
            const block = generated[key];
            const border = borders.filter(border => border.name == key)[0];
            block.forEach(saved => {
                const item = new Hexagon(saved.x, saved.y, this.params.settings.settings.tileRadius);
                item.setTexture(new ColorGroup(saved.colorIndex), textures);
                item.findAllNeighbours(this.objects, border)
                this.objects.push(item);
            });
        });
    }

    find(x, y) {
        return this.objects.filter(item => item.contains(x, y));
    }
}