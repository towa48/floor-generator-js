import { Point } from './types/point.js';
import { Texture } from './types/texture.js';
import { ColorGroup } from './types/color-group.js';
import { Hexagon } from './types/hexagon.js';
import { Rect } from './types/rect.js';
import { getRandomInt } from './utils.js';
import { colors } from './const.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const maxObjects = 1000;

const params = {
    scale: 2,
    maxInlineColors: 3,
    //border: [
    //    new Point(0,0),
    //    new Point(800,0),
    //    new Point(800,600),
    //    new Point(0, 600)
    //],
}

const hexagonRadius = 10.5*params.scale;
const patterns =  [
    new Texture("/images/texture/cotton_pattern.png"),
    new Texture("/images/texture/shell_pattern.png"),
    new Texture("/images/texture/sand_pattern.png")
];

// Implementation
let objects = [];

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

        animate();
    });

    const rect = new Rect(0, 0, 800, 600);
    fill(rect, loadedTextures);
}

function fill(rect, textures) {
    const root = new Hexagon(rect.x + hexagonRadius, rect.y + hexagonRadius, hexagonRadius);
    const colorIndex = getRandomInt(0, textures.length);
    const colorGroup = new ColorGroup(colorIndex);
    root.setTexture(colorGroup, textures);

    objects.push(root);
    refresh();

    root.spawn(objects, rect, textures, maxObjects, params.maxInlineColors, refresh);
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
    // TODO
}

function refresh() {
    c.clearRect(0, 0, canvas.width, canvas.height)

    objects.forEach(item => {
        item.update(c);
    })
}

// Animation Loop
function animate() {
    //requestAnimationFrame(animate)
    refresh();
}

await init()
refresh();
markSameGroup();
drawBorder();
