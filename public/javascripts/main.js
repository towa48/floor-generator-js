import { Point } from './types/point.js';
import { Texture } from './types/texture.js';
import { ColorGroup } from './types/color-group.js';
import { Hexagon } from './types/hexagon.js';
import { getRandomInt, parseBorder } from './utils.js';
import { colors } from './const.js';
import { Border } from './types/border.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const maxObjects = 1000;

const scale = 1; // TODO: remove

let borderVal = `(144,0);
(435,0);
(435,371);
(244,371);
(244,309);
(236,309);
(236,379);
(254,379);
(254,660);
(4,660);
(4,550);
(114,550);
(114,139);
(144,139);`;

const borderEl = document.querySelector('#border');
borderEl.value = borderVal;

const params = {
    scale: scale,
    maxInlineColors: 3,
    border: null,
}

updateBorder();

function updateCanvasSize() {
    const maxWidthPoint = params.border.reduce((prev, curr) => (prev.x > curr.x) ? prev : curr);
    const maxHeightPoint = params.border.reduce((prev, curr) => (prev.y > curr.y) ? prev : curr);

    canvas.width = maxWidthPoint.x + 50;
    canvas.height = maxHeightPoint.y + 50;
}

function updateBorder() {
    const borderVal = borderEl.value;
    params.border = parseBorder(borderVal);
    updateCanvasSize();
}

const hexagonRadius = 10.5*params.scale;
const patterns =  [
    new Texture("public/images/texture/cotton_pattern.png"),
    new Texture("public/images/texture/shell_pattern.png"),
    new Texture("public/images/texture/sand_pattern.png")
];

// Implementation
let objects = [];
let border = null;

const buttonEl = document.querySelector('#refresh');
buttonEl.addEventListener('click', async (e) => {
    c.clearRect(0, 0, canvas.width, canvas.height);
    objects = [];
    updateBorder();
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

async function init() {
    const tex1 = await patterns[0].load(c);
    const tex2 = await patterns[1].load(c);
    const tex3 = await patterns[2].load(c);

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

    border = new Border(c, params.border);
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

    root.spawn(objects, border, textures, maxObjects, params.maxInlineColors, refresh);
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

    tile1El.textContent = i1;
    tile2El.textContent = i2;
    tile3El.textContent = i3;
}

// Animation Loop
function animate() {
    //requestAnimationFrame(animate)
    refresh();
}

await init()
refresh();
updateStats();
//markSameGroup();
drawBorder();
