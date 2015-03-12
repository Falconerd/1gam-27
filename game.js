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
var entities = [];

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
    player = new Player;
    reticle = new Reticle;

    entities.push(player);
    entities.push(reticle);
    entities.push(new TailSegmentCircle(player));
    entities.push(new TailSegmentCircle(entities[2], 180));

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

/**
 * Math stuff
 */
Math.degToRad = function(angle) { return angle * Math.PI / 180; };
Math.radToDeg = function(angle) { return angle * 180 / Math.PI };

/**
 * ========== [ Entities ] =====================================================
 */
var Point = function(x, y)
{
    this.pos = { x: x || 0, y: y || 0 };
    this.interpolate = function(x, y, amplitude)
    {
        this.pos.x += (x - this.pos.x) * amplitude;
        this.pos.y += (y - this.pos.y) * amplitude;
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

var Entity = function(x, y, settings)
{
    if (!settings) settings = {
        size: { x: 5, y: 5 },
        pos: { x: 0, y: 0 },
        target: null,
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
            (other.pos.y + other.size.y * .5) - (this.pos.y + this.size.y * .5),
            (other.pos.x + other.size.x * .5) - (this.pos.x + this.size.x * .5));
    }

    this.getCentre = function()
    {
        return { x: this.pos.x - this.size.x * .5, y: this.pos.y - this.size.y * .5 };
    }

    this.update = function()
    {

    }

    this.draw = function()
    {

    }
}
Entity.prototype = new Point;

var Player = function(x, y, settings)
{
    this.radius = 7;
    this.size = { x: 14, y: 14 };
    this.speed = 25;
    this.angle = 0;
    this.draw = function()
    {
        ctx.save();
        ctx.translate(this.getCentre().x, this.getCentre().y);
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
        // var distanceToReticle = this.distanceTo(reticle);
        // if (distanceToReticle > this.size.x)
        // {
        //     this.angle = this.angleTo(reticle);

        //     this.pos.x -= (((this.pos.x - this.size.x * .5) - (reticle.pos.x - reticle.size.x * .5)) / this.speed);
        //     this.pos.y -= (((this.pos.y - this.size.y * .5) - (reticle.pos.y - reticle.size.y * .5)) / this.speed);
        // }

        var dx = mouse.x - (this.getCentre().x);
        var dy = mouse.y - (this.getCentre().y);
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.radius)
        {
            this.angle = Math.atan2(reticle.pos.y - (this.getCentre().y), reticle.pos.x - (this.getCentre().x));

            this.pos.x -= (((this.getCentre().x) - reticle.pos.x) / this.speed);
            this.pos.y -= (((this.getCentre().y) - reticle.pos.y) / this.speed);
        }

    }
}
Player.prototype = new Entity;

var Reticle = function(x, y, settings)
{
    this.size = { x: 4, y: 4 };
    this.radius = 2;
    this.draw = function()
    {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
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
Reticle.prototype = new Entity;

var TailSegmentCircle = function(target, offsetAngle)
{
    this.target = target;
    this.radius = 10;
    this.size = { x: 20, y: 20 };
    this.offsetDistance = 40;
    this.offsetAngle = offsetAngle || 0;
    this.angle = 0;

    this.draw = function()
    {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
        ctx.fill();
        ctx.stroke();

        if (this.target !== null)
        {
            ctx.beginPath();
            ctx.moveTo(this.pos.x, this.pos.y);
            ctx.quadraticCurveTo(this.getMidPoint(this.pos, target.getCentre()).x, this.getMidPoint(this.pos, target.getCentre()).y, this.target.getCentre().x, this.target.getCentre().y);
            ctx.stroke();
        }
    }
    this.update = function()
    {
        if (this.target !== null)
        {
            this.angle = Math.atan2(this.target.getCentre().y - this.getCentre().y, this.target.getCentre().x - this.getCentre().x);
            var tgt = this.getPointAlongAxis(this.target.angle + Math.degToRad(this.offsetAngle), this.offsetDistance);
            this.interpolate(this.target.getCentre().x - tgt.x, this.target.getCentre().y - tgt.y, 0.4);
        }
    }
}
TailSegmentCircle.prototype = new Entity;