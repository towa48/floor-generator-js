import { Point } from './types/point.js';
import { ColorGroup } from './types/color-group.js';
import { Hexagon } from './types/hexagon.js';
import { getRandomInt } from './utils/random.js';
import { colors } from './const.js';
import { Border } from './types/border.js';
import { load as yamltojson, dump as jsontoyaml } from './utils/js-yaml.js';
import { Params } from './types/params.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const maxObjectsThreshold = 1000;
const settingsEl = document.querySelector('#settings');

const params = new Params();

function updateCanvasSize() {
    const size = params.getSize();

    canvas.width = size.width;
    canvas.height = size.height;
}

function updateSettings() {
    const settingsVal = settingsEl.value;
    params.apply(yamltojson(settingsVal));

    updateCanvasSize();
}

const hexagonRadius = 10.5*params.settings.settings.scale;

// Implementation
let objects = [];
let border = null;

const buttonEl = document.querySelector('#refresh');
buttonEl.addEventListener('click', async (e) => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    objects = [];
    updateSettings();
    await init();
    drawBorder();
})

function find(x, y) {
    return objects.filter(item => item.contains(x, y));
}

function getCursorPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return new Point(x, y);
}

async function loadExample() {
    return new Promise((resolve, reject) => {
        window.api.send('load-example');
        window.api.receive('example-loaded', (data) => {
            settingsEl.value = data;
            params.apply(yamltojson(data));
            resolve();
        })
    });
}

async function init() {
    const loadedTextures = await params.loadTextures(c);

    let borders = [];
    Object.keys(params.rooms).forEach(room => {
        borders.push(new Border(c, params.rooms[room]));
    });

    canvas.addEventListener('mousedown', (e) => {
        const position = getCursorPosition(e);
        const items = find(position.x, position.y);
        items.forEach(item => {
            const nextColor = item.colorIndex + 1;
            const newColor = nextColor >= loadedTextures.length ? 0 : nextColor;
            item.setTexture(newColor, loadedTextures[newColor]);
        });

        refresh();
        updateStats();
        drawBorders(borders);
    });

    fill(borders, loadedTextures);
    refresh();
    updateStats();
    drawBorders(borders);

    //markSameGroup();
}

function fill(borders, textures) {
    borders.forEach(border => {
        fillOne(border, textures);
    })
}

function fillOne(border, textures) {
    const startPoint = border.path[0];
    const root = new Hexagon(startPoint.x + hexagonRadius/3, startPoint.y + hexagonRadius/3, hexagonRadius);
    const colorIndex = getRandomInt(0, textures.length);
    const colorGroup = new ColorGroup(colorIndex);
    root.setTexture(colorGroup, textures);

    objects.push(root);
    refresh();

    root.spawn(objects, border, textures, maxObjectsThreshold, params.settings.settings.maxInlineColors, refresh);
}

function markSameGroup() {
    objects.forEach(current => {
        const sameGroup = current.neighbours.items.filter(item => {
            return item.colorGroup === current.colorGroup;
        });
        sameGroup.forEach(item => {
            c.beginPath();
            c.moveTo(current.x, current.y);
            c.lineTo(item.x, item.y);
            c.strokeStyle = colors.red;
            c.stroke();
        })
    });
}

function drawBorders(borders) {
    borders.forEach(border => {
        border.draw();
    });
}

function refresh() {
    c.clearRect(0, 0, canvas.width, canvas.height)

    objects.forEach(item => {
        item.update(c);
    });
}

function updateStats() {
    const rootEl = document.querySelector('#stats');

    const stats = {};
    const names = Object.keys(params.settings.patterns);

    objects.forEach(item => {
        const name = names[item.colorGroup.colorIndex] || 'unknown';
        if (!stats[name]) {
            stats[name] = {
                count: 0,
                boxes: 0
            }
        }

        stats[name].count++;
    });

    // clear stats html
    rootEl.innerHTML = '';

    const boxCount = params.settings.settings.perBoxCount;
    Object.keys(stats).forEach(key => {
        stats[key].boxes = Math.ceil(stats[key].count/boxCount);

        const el = document.createElement('p');
        el.innerHTML = `${key}: ${stats[key].count} (${stats[key].boxes} boxes)`;
        rootEl.appendChild(el);
    });
}

// Animation Loop
function animate() {
    //requestAnimationFrame(animate)
    refresh();
}

await loadExample();
updateCanvasSize();
await init();
