(async function(innerWidth, innerHeight) {
    'use strict';

    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d');

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const maxInlineColors = 3;
    const colors = { red: '#ff0000' };

    const maxObjects = 100000;

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

    class Circle {
        constructor(x, y, radius, color) {
          this.x = x
          this.y = y
          this.radius = radius
          this.color = color
        }

        draw() {
          c.beginPath()
          c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
          c.fillStyle = this.color
          c.fill()
          c.closePath()
        }

        update() {
          this.draw()
        }

        contains(x, y) {
            return Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2) < Math.pow(this.radius, 2);
        }

        spawn() {
            // do nothing
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
            this.right = null;
            this.bottomRight = null;
            this.bottom = null;
            this.bottomLeft = null;
            this.left = null;
        }

        getRelativePosition(key) {
            switch(key) {
                case 'topLeft':
                    return new Point(-20, -15);
                case 'top':
                    return new Point(0, -20);
                case 'topRight':
                    return new Point(20, -15);
                case 'right':
                    return new Point(20, 0);
                case 'bottomRight':
                    return new Point(20, 15);
                case 'bottom':
                    return new Point(0, 20);
                case 'bottomLeft':
                    return new Point(-20, 15);
                case 'left':
                    return new Point(-20, 0);
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
                case 'right':
                    return 'left';
                case 'bottomRight':
                    return 'topLeft';
                case 'bottom':
                    return 'top';
                case 'bottomLeft':
                    return 'topRight';
                case 'left':
                    return 'right';
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
            //c.fillRect(this.x-this.radius, this.y-this.height, this.x+this.radius, this.y+this.height);
        }

        update() {
            this.draw()
        }

        contains(x, y) {
              return Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2) < Math.pow(this.radius, 2);
        }

        setTexture(colorGroup, textures) {
            if (colorGroup) {
                this.colorGroup = colorGroup;
            } else {
                const newIndex = getRandomInt(0, textures.length);
                this.colorGroup = new ColorGroup(newIndex);
            }

            this.texture = textures[this.colorGroup.colorIndex];
            this.colorGroup.members.push(this);
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

                const relativePosition = this.neighbours.getRelativePosition(key);
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
                const newColor = getRandomInt(0, textures.length);
                if (newColor == this.colorGroup.colorIndex && this.colorGroup.members.length < maxInlineColors) {
                    hexagon.setTexture(this.colorGroup, textures);
                } else if (newColor !== this.colorGroup.colorIndex) {
                    const newGroup = new ColorGroup(newColor);
                    hexagon.setTexture(newGroup, textures);
                } else if (this.colorGroup.members.length >= maxInlineColors) {
                    let nextColor = newColor+1;
                    if (nextColor >= textures.length) {
                        nextColor = 0;
                    }
                    const nextGroup = new ColorGroup(nextColor);
                    hexagon.setTexture(nextGroup, textures);
                }

                objects.push(hexagon);
                this.neighbours[key] = hexagon;

                const oppositeKey = this.neighbours.getOppositeKey(key);
                hexagon.neighbours[oppositeKey] = this;



                hexagon.spawn(objects, border, textures);
            });

            //const exampleHexagon = new Hexagon(0, 0, hexagonRadius, 0, null);
            //const stepx = hexagonRadius*3;
            //const stepy = exampleHexagon.height;

            //const deltax = (j % 2)*hexagonRadius*1.5;
            //const centerX = hexagonRadius + i*stepx + deltax;
            //const centerY = stepy + j*stepy;
        }
    }

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
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

    const hexagonRadius = 10.5*2;
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

        const rect = new Rect(0, 0, 250, 150);
        fill(rect, loadedTextures);
    }

    function fill(rect, textures) {
        const root = new Hexagon(rect.x, rect.y, hexagonRadius);
        const colorIndex = getRandomInt(0, textures.length);
        const colorGroup = new ColorGroup(colorIndex);
        root.setTexture(colorGroup, textures);

        objects.push(root);

        root.spawn(objects, rect, textures);
    }

    function refresh() {
        c.clearRect(0, 0, canvas.width, canvas.height)

        //c.fillText('HTML CANVAS BOILERPLATE', mouse.x, mouse.y)
        objects.forEach(object => {
            object.update()
        })
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate)
        refresh();
    }
  
  await init()
  refresh();

})(window.innerWidth, window.innerHeight);
