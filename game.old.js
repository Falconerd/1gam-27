/**
 * Set up the canvas
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 710;
canvas.height = 320;

/**
 * Declare some global variables
 */
var paused = false;
var delta, then;
var mouse = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0
};
var player;
var reticle;

/**
 * Places to hold things
 */
var entities = [], enemies = [];

/**
 * Load the game
 */
window.onload = function()
{
    reset();
    then = Date.now();
    main();
}

window.requestAnimFrame = (function()
{
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function(callback)
            {
                window.setTimeout(callback, 1000 / 60);
            }
})();

/**
 * Run every time the game starts.
 */
var reset = function()
{
    init();
}

/**
 * Initialise the things
 */
var init = function()
{
    player = new Player(0, 0, 10);
    reticle = new Reticle();
    entities.push(new PlayerLinkCircle(50, 50, 9, player));
    entities.push(new PlayerLinkCircle(50, 50, 8, entities[0]));
    entities.push(new PlayerLinkCircle(50, 50, 7, entities[1], 45));
    entities.push(new PlayerLinkCircle(50, 50, 6, entities[2]));
    entities.push(new PlayerLinkCircle(50, 50, 5, entities[3]));
    entities.push(new PlayerLinkCircle(50, 50, 4, entities[4]));
    entities.push(new PlayerLinkCircle(50, 50, 3, entities[5]));
    entities.push(new PlayerLinkCircle(50, 50, 2, entities[6]));
    entities.push(new PlayerLinkCircle(50, 50, 1, entities[7]));
    entities.push(new EntityCircle(200, 200, { radius: 8 }));
    entities.push(new EntityEatme(300, 200));

    canvas.addEventListener("mousemove", onMouseMove, false);
}

/**
 * Update everything
 */
var update = function()
{
    for (var i = entities.length - 1; i >= 0; i--) {
        entities[i].update();
    }
    player.update();
    reticle.update();
}

/**
 * Draw everything
 */
var draw = function()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = entities.length - 1; i >= 0; i--) {
        entities[i].draw();
    }
    player.draw();
    reticle.draw();
}

/**
 * The main game loop
 */
var main = function()
{
    var now = Date.now();
    delta = now - then;

    update();
    draw();

    then = now;
    requestAnimFrame(main);
}

/**
 * Math stuff
 */
Math.degToRad = function(angle) { return angle * Math.PI / 180; };
Math.radToDeg = function(angle) { return angle * 180 / Math.PI };

/**
 * Point
 */
var Point = function(x, y)
{
    this.x = x || 0;
    this.y = y || 0;
    this.interpolate = function(x, y, amplitude)
    {
        this.x += (x - this.x) * amplitude;
        this.y += (y - this.y) * amplitude;
    }
    this.getPointAlongAxis = function(angle, distance)
    {
        return { x: distance * Math.cos(angle), y: distance * Math.sin(angle) };
    }
    this.getPointAlongAxis2 = function(angle, distance)
    {
        return { x: distance * Math.cos(Math.degToRad(angle)), y: distance * Math.sin(Math.degToRad(angle)) };
    }
    this.getMidPoint = function(a, b)
    {
        return { x: (a.x + b.x) * .5, y: (a.y + b.y) * .5 };
    }
}

/**
 * Entity extends Point
 */
var Entity = function(x, y, settings)
{
    if (!settings) settings = {
        size: { x: 5, y: 5 },
        pos: { x: 0, y: 0 }
    }

    for (var setting in settings)
    {
        if (settings.hasOwnProperty(setting))
        {
            this[setting] = settings[setting];
        }
    }
    this.distanceTo = function(other)
    {
        var x1 = other.getCentre().x;
        var x2 = this.getCentre().x;
        var y1 = other.getCentre().y;
        var y2 = this.getCentre().y;
        return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
    }

    this.angleTo = function(other)
    {
        return Math.atan2(
            (other.y + other.size.y * .5) - (this.y + this.y * .5),
            (other.x + other.size.x * .5) - (this.x + this.x * .5));
    }

    this.getCentre = function()
    {
        return { x: this.x - this.size.x * .5, y: this.y - this.size.y * .5 };
    }

    this.update = function()
    {

    }

    this.draw = function()
    {

    }
}
Entity.prototype = new Point;

/**
 * Circular entity extends Entity
 */
var EntityCircle = function(x, y, settings)
{
    if (settings === undefined)
    {
        var settings = {};
    }
    this.x = x || 0;
    this.y = y || 0;
    this.radius = settings.radius || 8;
    this.draw = function()
    {
        ctx.strokeStyle = this.stroke;
        ctx.fillStyle = this.fill;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(255, 0, 200, 0.9)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.shadowColor = "rgba(255, 0, 200, 0.9)";
        ctx.fill();
        ctx.stroke();
    }
    this.update = function()
    {
    }
}
EntityCircle.prototype = new Entity;

/**
 * Eatme entity extends EntityCircle
 */
var EntityEatme = function(x, y, settings)
{
    if (settings === undefined)
    {
        var settings = {};
    }
    this.x = x || 0;
    this.y = y || 0;
    this.radius = settings.radius || 4;
    this.draw = function()
    {
        ctx.strokeStyle = this.stroke;
        ctx.fillStyle = this.fill;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(0, 255, 50, 0.9)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.shadowColor = "rgba(0, 255, 50, 0.9)";
        ctx.fill();
        ctx.stroke();
    }
    this.update = function()
    {
    }
}
EntityEatme.prototype = new EntityCircle;

/**
 * Player extends Entity
 */
var Player = function(x, y, radius)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 8;
    this.speed = 25;
    this.angle = 0;
    this.draw = function()
    {
        ctx.save();
        ctx.translate(this.x - this.radius, this.y - this.radius);
        ctx.rotate(this.angle);

        // --------

        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.shadowColor = "rgba(0, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, .3 * Math.PI, 1.3 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0.7 * Math.PI, 1.7 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // --------

        ctx.restore();
    }
    this.update = function()
    {
        if (isNaN(delta) || delta <= 0) return;

        var dx = mouse.x - (this.x - this.radius);
        var dy = mouse.y - (this.y - this.radius);
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.radius)
        {
            this.angle = Math.atan2(mouse.y - (this.y - this.radius), mouse.x - (this.x - this.radius));;

            this.x -= (((this.x - this.radius) - mouse.x) / this.speed);
            this.y -= (((this.y - this.radius) - mouse.y) / this.speed);
        }

        for (var i = entities.length - 1; i >= 0; i--) {
            // if (distanceBetween(this, entities[i]) < this.radius && angleBetween(this, entities[i]))
            // {
            //     this.ateSummat(entities[i], i);
            // }
        }
    }
    this.ateSummat = function(entity, index)
    {
        // do things with entity
        entities.splice(index, 1);
    }
    this.getCentre = function() { return { x: this.x - this.radius, y: this.y - this.radius } };
}
Player.prototype = new EntityCircle;

var PlayerLinkCircle = function(x, y, radius, parent, angleOffset)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 5;
    this.parent = parent || player;
    this.angleOffset = angleOffset || 0;
    this.speed = 5;
    this.draw = function()
    {
        ctx.save();
        ctx.translate(this.x - this.radius, this.y - this.radius);
        ctx.rotate(this.angle);

        // --------

        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.shadowColor = "rgba(0, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, .3 * Math.PI, 1.3 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0.7 * Math.PI, 1.7 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // --------

        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(this.getCentre().x, this.getCentre().y);
        ctx.quadraticCurveTo(this.getMidPoint(this, parent.getCentre()).x, this.getMidPoint(this, parent.getCentre()).y, this.parent.getCentre().x, this.parent.getCentre().y);
        ctx.stroke();
    }
    this.update = function()
    {
        if (isNaN(delta) || delta <= 0) return;

        var dx = (this.parent.x - this.parent.radius) - (this.x - this.radius);
        var dy = (this.parent.y - this.parent.radius) - (this.y - this.radius);
        var distance = Math.sqrt(dx * dx + dy * dy);
        this.angle = Math.atan2(this.parent.getCentre().y - this.getCentre().y, this.parent.getCentre().x - this.getCentre().x);;
        if (distance > this.radius * 3)
        {
            var tgt = this.getPointAlongAxis(this.parent.angle + Math.degToRad(this.offsetAngle), this.radius * 3);
            this.interpolate(this.parent.getCentre().x + tgt.x, this.parent.getCentre().y + tgt.y, 0.4);
            //this.x -= (((this.x - this.radius) - (this.parent.x - this.parent.radius)) / this.speed);
            //this.y -= (((this.y - this.radius) - (this.parent.y - this.parent.radius)) / this.speed);
        }
    }
}
PlayerLinkCircle.prototype = new EntityCircle;

var Reticle = function()
{
    this.x = 0;
    this.y = 0;
    this.radius = 2;
    this.draw = function()
    {
        ctx.strokeStyle = this.stroke;
        ctx.fillStyle = this.fill;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
        ctx.fill();
        ctx.stroke();
    }
    this.update = function()
    {
        this.interpolate(mouse.x + 1, mouse.y + 1, 0.4);
    }
}
Reticle.prototype = new Point;

/**
 * Misc functions
 */

/**
 * Event Handlers
 */
var onMouseMove = function(event)
{
    var rect = canvas.getBoundingClientRect();
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.velX = Math.abs(mouse.x - mouse.lastX) / canvas.width;
    mouse.velX = Math.abs(mouse.y - mouse.lastY) / canvas.height;
}