import { Point } from './src/point';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const colors = { red: '#ff0000' };

const maxObjects = 1000;

const params = {
    scale: 2,
    maxInlineColors: 3,
    border: [
        new Point(0,0),
        new Point(800,0),
        new Point(800,600),
        new Point(0, 600)
    ],
}

class Texture {
    constructor(source) {
        this.source = source;
        this.pattern = null;
        this.image = null;
    }

    load() {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = this.source;
            image.onload = () => {
                this.image = image;
                this.pattern = c.createPattern(image, "repeat")
                resolve(this.pattern);
            }
        });
    }
}

class ColorGroup {
    constructor(index) {
        this.colorIndex = index;
        this.members = [];
    }
}

class HexagonNeighbours {
    constructor() {
        this.topLeft = null;
        this.top = null;
        this.topRight = null;
        this.bottomRight = null;
        this.bottom = null;
        this.bottomLeft = null;
    }

    get items() {
        return Object.keys(this).map(key => {
            return this[key];
        }).filter(item => item instanceof Hexagon);
    }

    getRelativePosition(key, radius) {
        const h = Math.sqrt(Math.pow(radius,2)-Math.pow(radius/2,2));
        switch(key) {
            case 'topLeft':
                return new Point(-1.5*radius, -h);
            case 'top':
                return new Point(0, -2*h);
            case 'topRight':
                return new Point(1.5*radius, -h);
            case 'bottomRight':
                return new Point(1.5*radius, h);
            case 'bottom':
                return new Point(0, 2*h);
            case 'bottomLeft':
                return new Point(-1.5*radius, h);
            default:
                new Error(`Unknown position: ${key}`);
        }
    }

    getOppositeKey(key) {
        switch(key) {
            case 'topLeft':
                return 'bottomRight';
            case 'top':
                return 'bottom';
            case 'topRight':
                return 'bottomLeft';
            case 'bottomRight':
                return 'topLeft';
            case 'bottom':
                return 'top';
            case 'bottomLeft':
                return 'topRight';
            default:
                new Error(`Unknown position: ${key}`);
        }
    }
}

class Hexagon {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.halfRadius = radius/2;
        this.height = Math.sqrt(Math.pow(radius,2)-Math.pow(this.halfRadius,2));

        this.neighbours = new HexagonNeighbours();

        this.colorGroup = null;
        this.texture = null;
    }

    draw() {
        c.beginPath();

        c.moveTo(this.x + this.radius, this.y);
        c.lineTo(this.x + this.halfRadius, this.y + this.height);
        c.lineTo(this.x - this.halfRadius, this.y + this.height);
        c.lineTo(this.x - this.radius, this.y);
        c.lineTo(this.x - this.halfRadius, this.y - this.height);
        c.lineTo(this.x + this.halfRadius, this.y - this.height);
        c.closePath();

        c.fillStyle = this.texture || colors.red;
        c.fill();
    }

    update() {
        this.draw()
    }

    contains(point) {
        const p1 = new Point(this.x-this.halfRadius, this.y-this.height);
        const p2 = new Point(this.x+this.halfRadius, this.y+this.height);
        if (point.x >= p1.x && point.x <= p2.x && point.y > p1.y && point.y < p2.y) {
            return true;
        }

        // TODO:
        return false;
    }

    setTexture(colorGroup, textures) {
        if (!colorGroup || !textures) {
            throw new Error('Unknown color group');
        }

        this.colorGroup = colorGroup;
        this.texture = textures[this.colorGroup.colorIndex];
        this.colorGroup.members.push(this);
    }

    findAllNeighbours(objects, border) {
        Object.keys(this.neighbours).forEach(key => {
            if (this.neighbours[key] || this.neighbours[key] === -1) {
                return;
            }

            const relativePosition = this.neighbours.getRelativePosition(key, this.radius);
            const position = new Point(this.x + relativePosition.x, this.y + relativePosition.y);
            if (!border.contains(position)) {
                this.neighbours[key] = -1;
                return;
            }

            const exists = objects.filter(item => item.contains(position));
            const found = exists.length > 0 ? exists[0] : null;
            if (!found) {
                return;
            }

            this.neighbours[key] = found;
        });
    }

    spawn(objects, border, textures) {
        if (objects.length >= maxObjects) {
            console.log('Stack exceeded');
            return;
        }

        Object.keys(this.neighbours).forEach(key => {
            if (this.neighbours[key] || this.neighbours[key] === -1) {
                return;
            }

            const relativePosition = this.neighbours.getRelativePosition(key, this.radius);
            const position = new Point(this.x + relativePosition.x, this.y + relativePosition.y);
            if (!border.contains(position)) {
                this.neighbours[key] = -1;
                return;
            }

            // check any existing item at that position
            const exists = objects.filter(item => item.contains(position));
            const found = exists.length > 0 ? exists[0] : null;
            if (found) {
                // TODO: any color check?
                this.neighbours[key] = found;
                return;
            }

            const hexagon = new Hexagon(position.x, position.y, this.radius);
            this.neighbours[key] = hexagon;
            const oppositeKey = this.neighbours.getOppositeKey(key);
            hexagon.neighbours[oppositeKey] = this;

            // find all neighbours before color
            hexagon.findAllNeighbours(objects, border);

            let newColor = getRandomInt(0, textures.length-1);
            let violate = true;
            let i = 1;
            while(violate && i <= textures.length) {
                violate = this.isColorViolate(hexagon, newColor);

                if (violate) {
                    newColor = newColor + 1;
                    if (newColor > textures.length-1) {
                        newColor = 0;
                    }

                    i++;
                }
            }

            if (violate) {
                hexagon.setTexture(new ColorGroup(-1), textures);
            } else {
                // concat neighbours color group
                const neighboursWithColor = hexagon.neighbours.items.filter(item => item.colorGroup.colorIndex == newColor);
                const colorGroup = new ColorGroup(newColor);
                const allMembers = neighboursWithColor.reduce((prev, current) => {
                    return prev.concat(current.colorGroup.members);
                }, [hexagon]);

                allMembers.forEach(item => {
                    item.setTexture(colorGroup, textures);
                });
            }

            objects.push(hexagon);
            refresh();

            hexagon.spawn(objects, border, textures);
        });
    }

    isColorViolate(hexagon, colorIndex) {
        const same = hexagon.neighbours.items.filter(item => {
            return item.colorGroup.colorIndex == colorIndex;
        });
        const sameOverall = same.reduce((prev, curr) => {
            return prev.concat(curr.colorGroup.members);
        }, []);
        return sameOverall.length >= params.maxInlineColors;
    }
}

class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this._x2 = this.x + width;
        this._y2 = this.y + height;
    }

    contains(point) {
        return point.x >= this.x && point.x <= this._x2 && point.y > this.y && point.y < this._y2;
    }
}

function getRandomInt(min, max) {
    max += 1; // include max

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

const hexagonRadius = 10.5*params.scale;
const patterns =  [
    new Texture("texture/cotton_pattern.png"),
    new Texture("texture/shell_pattern.png"),
    new Texture("texture/sand_pattern.png")
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
    const tex1 = await patterns[0].load();
    const tex2 = await patterns[1].load();
    const tex3 = await patterns[2].load();

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

    root.spawn(objects, rect, textures);
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

function refresh() {
    c.clearRect(0, 0, canvas.width, canvas.height)

    //c.fillText('HTML CANVAS BOILERPLATE', mouse.x, mouse.y)
    objects.forEach(item => {
        item.update()
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
