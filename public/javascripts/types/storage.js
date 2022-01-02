import { ColorGroup } from './color-group.js';
import { Hexagon } from './hexagon.js';

export class Storage {
    constructor(params) {
        this.objects = [];
        this.objectsByRoom = {};
        this.params = params;
    }

    clear() {
        this.objects = [];
        this.objectsByRoom = {};
        this.params.settings.generated = {};
    }

    push(item, border) {
        const room = border.name;

        this.objects.push(item);
        if (!this.objectsByRoom[room]) {
            this.objectsByRoom[room] = [];
        }
        this.objectsByRoom[room].push(item)

        const generated = this.params.settings.generated;
        if (!generated[room]) {
            generated[room] = [];
        }
        generated[room].push(item.toSave());
    }

    load(ctx, textures) {
        this.objects = [];
        this.objectsByRoom = {};
        const generated = this.params.settings.generated;
        const borders = this.params.getBorders(ctx);
        Object.keys(generated).forEach(key => {
            const block = generated[key];
            const border = borders.filter(border => border.name == key)[0];
            block.forEach(saved => {
                const item = new Hexagon(saved.x, saved.y, this.params.settings.settings.tileRadius);
                item.setTexture(new ColorGroup(saved.colorIndex), textures);
                item.findAllNeighbours(this.objects, border)
                this.push(item, border);
            });
        });
    }

    find(point) {
        return Object.keys(this.objectsByRoom).map(room => {
            const items = this.objectsByRoom[room].filter(item => item.contains(point));
            return {
                items,
                room
            };
        });
    }

    updateRoom(name) {
        const generated = this.params.settings.generated;
        generated[name] = [];
        const items = this.objectsByRoom[name];

        items.forEach(item => {
            generated[name].push(item.toSave());
        })
    }
}