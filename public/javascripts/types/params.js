import { Point } from './point.js';
import { Texture } from './texture.js';
import { mergeDeep } from '../utils/assign.js';

const defaultSettings = {
    settings: {
        scale: 1,
        maxInlineColors: 3,
        perBoxCount: 16,
    },
    patterns: {
        cotton: 'public/images/texture/cotton_pattern.png',
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
    this.settings = mergeDeep({}, defaultSettings);
    this.rooms = {};
    this.textures = {};

    this.apply();
  }

  apply(settings) {
    if (settings) {
      this.settings.patterns = {};
      this.settings = mergeDeep(this.settings, settings || {});
    }
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
    let points = [];
    Object.keys(this.rooms).forEach(key => {
      points = points.concat(this.rooms[key]);
    });

    const maxWidthPoint = points.reduce((prev, curr) => (prev.x > curr.x) ? prev : curr);
    const maxHeightPoint = points.reduce((prev, curr) => (prev.y > curr.y) ? prev : curr);

    return { width: maxWidthPoint.x + 50, height: maxHeightPoint.y + 50 };
  }

  loadTextures(ctx) {
    const tasks = Object.keys(this.textures).map(key => this.textures[key].load(ctx));
    return Promise.all(tasks);
  }

  clear() {
    this.rooms = {};
    this.textures = {};
  }
}