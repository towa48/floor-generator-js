import { Point } from './types/point.js';
import { ColorGroup } from './types/color-group.js';
import { Hexagon } from './types/hexagon.js';
import { getRandomInt } from './utils/random.js';
import { colors } from './const.js';
import { Border } from './types/border.js';
import { load } from './utils/js-yaml.js';
import { Params } from './types/params.js';

const yamltojson = load;

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
    const tex1 = await params.textures.cotton.load(c);
    const tex2 = await params.textures.shell.load(c);
    const tex3 = await params.textures.send.load(c);

    const loadedTextures = [tex1, tex2, tex3];

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
        drawBorder();
    });

    const first = Object.keys(params.rooms)[0];
    border = new Border(c, params.rooms[first]);
    fill(border, loadedTextures);
    updateStats();
}

function fill(border, textures) {
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

function drawBorder() {
    border.draw();
}

function refresh() {
    c.clearRect(0, 0, canvas.width, canvas.height)

    objects.forEach(item => {
        item.update(c);
    });
}

function updateStats() {
    const tile1El = document.querySelector('#count1');
    const tile2El = document.querySelector('#count2');
    const tile3El = document.querySelector('#count3');

    let i1 = 0;
    let i2 = 0;
    let i3 = 0;

    objects.forEach(item => {
        switch(item.colorGroup.colorIndex) {
            case 0:
                i1++;
                break
            case 1:
                i2++;
                break;
            case 2:
                i3++;
                break;
        }
    });

    tile1El.textContent = `${i1} (${Math.ceil(i1/params.settings.settings.perBoxCount)} boxes)`;
    tile2El.textContent = `${i2} (${Math.ceil(i2/params.settings.settings.perBoxCount)} boxes)`;
    tile3El.textContent = `${i3} (${Math.ceil(i3/params.settings.settings.perBoxCount)} boxes)`;
}

// Animation Loop
function animate() {
    //requestAnimationFrame(animate)
    refresh();
}

await loadExample();
updateCanvasSize();
await init()
refresh();
updateStats();
//markSameGroup();
drawBorder();
