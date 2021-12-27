import { Point } from './types/point.js';

export function getRandomInt(min, max) {
    max += 1; // include max

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export function parseBorder(val) {
    if (!val) {
        return [];
    }

    const coordinatesRegexp=/\(\s*(\d+)\s*\,\s*(\d+)\s*\)/;

    const pairs = val.replace(/\r?\n|\r/gm, '').split(';').map(val => val.trim()).filter(val => !!val);
    return pairs.map((val) => {
        if (!val) {
            return;
        }

        const pair = val.match(coordinatesRegexp);
        return new Point(parseFloat(pair[1]), parseFloat(pair[2]));
    })
}