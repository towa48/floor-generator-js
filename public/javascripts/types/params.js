import { Point } from './point.js';
import { Texture } from './texture.js';

const defaultSettings = {
    settings: {
        scale: 1,
        maxInlineColors: 3,
    },
    patterns: {
        cotton: 'public/images/texture/cotton_pattern.png',
        shell: 'public/images/texture/shell_pattern.png',
        send: 'public/images/texture/sand_pattern.png',
    },
    rooms: {
        living: [
            [10,10],
            [210, 10],
            [210, 210],
            [30, 210],
        ]
    },
}

export class Params {
  constructor() {
    this.settings = Object.assign({}, defaultSettings);
    this.rooms = {};
    this.textures = {};

    this.apply();
  }

  apply(settings) {
    this.settings = Object.assign(this.settings, settings || {});
    this.clear();
    this.parseRooms();
    this.parseTextures();
  }

  parseRooms() {
    Object.keys(this.settings.rooms).forEach(key => {
        this.rooms[key] = [];
        const coords = this.settings.rooms[key];
        coords.forEach(pair => {
            this.rooms[key].push(new Point(pair[0], pair[1]));
        });
    });
  }

  parseTextures() {
    Object.keys(this.settings.patterns).forEach(key => {
        this.textures[key] = new Texture(this.settings.patterns[key]);
    });
  }

  getSize() {
    const first = Object.keys(this.rooms)[0];
    const maxWidthPoint = this.rooms[first].reduce((prev, curr) => (prev.x > curr.x) ? prev : curr);
    const maxHeightPoint = this.rooms[first].reduce((prev, curr) => (prev.y > curr.y) ? prev : curr);

    return { width: maxWidthPoint.x + 50, height: maxHeightPoint.y + 50 };
  }

  clear() {
    this.rooms = {};
    this.textures = {};
  }
}