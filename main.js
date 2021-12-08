(async function(innerWidth, innerHeight) {
    'use strict';

    const canvas = document.querySelector('canvas');
    const c = canvas.getContext('2d');

    canvas.width = innerWidth;
    canvas.height = innerHeight;

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
    }

    class Hexagon {
        constructor(x, y, radius, texture) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.texture = texture;

            this.halfRadius = radius/2;
            this.height = Math.sqrt(Math.pow(radius,2)-Math.pow(this.halfRadius, 2));
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

            c.fillStyle = this.texture;
            c.fill();
            //c.fillRect(this.x-this.radius, this.y-this.height, this.x+this.radius, this.y+this.height);
          }

          update() {
            this.draw()
          }
    }

    function getRandomInt(min, max) {
        max += 1; // include max

        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    const hexagonRadius = 10.5;
    const exampleHexagon = new Hexagon(0, 0, hexagonRadius, null);
    const colors = ['#2185C5', '#7ECEFD', '#FFF6E5', '#FF7F66'];
    const patterns =  [
        new Texture("texture/cotton_pattern.png"),
        new Texture("texture/shell_pattern.png"),
        new Texture("texture/sand_pattern.png")
    ];

    // Implementation
    let objects
    async function init() {
        objects = [];

        const tex1 = await patterns[0].load();
        const tex2 = await patterns[1].load();
        const tex3 = await patterns[2].load();

        const loadedTextures = [tex1, tex2, tex3];
        const stepx = hexagonRadius*3;
        const stepy = exampleHexagon.height;

        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                const rand = getRandomInt(0, loadedTextures.length);
                const deltax = (j % 2)*hexagonRadius*1.5;
                objects.push(new Hexagon(hexagonRadius + i*stepx + deltax, stepy + j*stepy, hexagonRadius, loadedTextures[rand]));
            }
        }
    }

    // Animation Loop
    function animate() {
        //requestAnimationFrame(animate)
        c.clearRect(0, 0, canvas.width, canvas.height)

        //c.fillText('HTML CANVAS BOILERPLATE', mouse.x, mouse.y)
        objects.forEach(object => {
          object.update()
        })
    }
  
  await init()
  animate()

})(window.innerWidth, window.innerHeight);
