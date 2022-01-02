import { Point } from './types/point.js';
import { ColorGroup } from './types/color-group.js';
import { Hexagon } from './types/hexagon.js';
import { getRandomInt } from './utils/random.js';
import { colors } from './const.js';
import { load as yamltojson, dump as jsontoyaml } from './utils/js-yaml.js';
import { Params } from './types/params.js';
import { Storage } from './types/storage.js';

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

const hexagonRadius = params.settings.settings.tileRadius*params.settings.settings.scale;

// Implementation
const storage = new Storage(params);

const buttonEl = document.querySelector('#refresh');
buttonEl.addEventListener('click', async (e) => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    storage.clear();
    updateSettings();
    await init();

    const borders = params.getBorders(c);
    drawBorders(borders);
})

const loadEl = document.querySelector('#load');
loadEl.addEventListener('click', async (e) => {
    window.api.send('open');
});
window.api.receive('save-loaded', async (data) => {
    settingsEl.value = data;
    params.apply(yamltojson(data));

    const loadedTextures = await params.loadTextures(c);
    const borders = params.getBorders(c);
    storage.load(c, loadedTextures);
    refresh();
    updateStats();
    drawBorders(borders);
});

const exportEl = document.querySelector('#export');
exportEl.addEventListener('click', async (e) => {
    window.api.send('save', jsontoyaml(params.settings));
});

function find(x, y) {
    return storage.find(new Point(x, y));
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

    const borders = params.getBorders(c);

    canvas.addEventListener('mousedown', (e) => {
        const position = getCursorPosition(e);
        const results = find(position.x, position.y);
        results.forEach(result => {
            const room = result.room;
            const items = result.items;

            if (items.length === 0)
                return;

            items.forEach(item => {
                const nextColor = item.colorGroup.colorIndex + 1;
                const newColor = nextColor >= loadedTextures.length ? 0 : nextColor;
                item.setTexture(new ColorGroup(newColor), loadedTextures);
            });

            storage.updateRoom(room);
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

    storage.push(root, border);

    params.settings.generated[border.name].push(root.toSave());
    refresh();

    root.spawn(storage, border, textures, maxObjectsThreshold, params.settings.settings.maxInlineColors, refresh);
}

function markSameGroup() {
    storage.objects.forEach(current => {
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

    storage.objects.forEach(item => {
        item.update(c);
    });
}

function updateStats() {
    const rootEl = document.querySelector('#stats');

    const stats = {};
    const names = Object.keys(params.settings.patterns);

    storage.objects.forEach(item => {
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
//function animate() {
//    requestAnimationFrame(animate)
//    refresh();
//}

await loadExample();
updateCanvasSize();
await init();
