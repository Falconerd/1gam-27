/**
 * I am aware that I have polluted the fuck out of the global namespace.
 * As this is more of a proof of concept game, I don't see the issue with it,
 * besides that it is not good practice.
 */

/**
 * Credits
 *
 * Background music: Alexandr Zhelanov, https://soundcloud.com/alexandr-zhelanov
 * Sound effects:    http://opengameart.org/users/lokif
 */

/**
 * Set up the canvas
 */
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
canvas.width = 710;
canvas.height = 400;

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
    velY: 0,
    radius: 0
};
var player;
var reticle;
var entities = [];
var spawnTimeEnemy = 1;
var spawnTimeFood = 2;
var lastEnemySpawned = 0;
var lastFoodSpawned = 0;
var foodCount = 0;
var enemyCount = 0;
var score = 0;
var fps;
var state = 'start';
var modalStart;
var difficulty = 0;
var difficultyTime = 5;
var debug = false;
var soundNom;
var soundNomVolume = .12;
var soundHit;
var soundHitVolume = .12;
var backgroundAudio = new Audio("bg.mp3");
backgroundAudio.loop = true;
backgroundAudio.volume = .25;
backgroundAudio.load();

/**
 * Load the game
 */
window.onload = function()
{
    canvas.addEventListener("mousemove", onMouseMove, false);
    canvas.addEventListener("click", onMouseClick, false);
    window.addEventListener("keyup", keyup, false);

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
 * Keyup stuff
 */
var keyup = function(event)
{
    if (event.keyCode === 38)
    {
        (backgroundAudio.volume >= 1) ? backgroundAudio.volume = 1 : backgroundAudio.volume += .1 ;
    }
    else if (event.keyCode === 40)
    {
        (backgroundAudio.volume <= .1) ? backgroundAudio.volume = 0 : backgroundAudio.volume -= .1 ;
    }
}

/**
 * Run every time the game starts.
 */
var reset = function()
{
    canvas.style.cursor = 'default';

    if (state === 'playing')
    {
        init();
        canvas.style.cursor = 'none';
    }
    else if (state === 'start')
    {
        modalStart = new Modal;
    }
    else if (state === 'restart')
    {
        modalStart = new Modal;
    }
}

/**
 * Initialise the things
 */
var init = function()
{
    player = new Player(canvas.width / 2, canvas.height / 2);
    player.endPoints.push(player);
    reticle = new Reticle;
    entities = [];
    foodCount = 0;
    enemyCount = 0;
    lastEnemySpawned = 0;
    lastFoodSpawned = 0;
    score = 0;
    difficulty = 0;
    difficultyTime = 5;

    soundNom = new SoundPool(10);
    soundHit = new SoundPool(10);

    soundNom.init("nomnom");
    soundHit.init("hit");

    backgroundAudio.play();

    entities.push(player);
    entities.push(reticle);
}

/**
 * Update everything
 */
var update = function()
{
    if (state !== 'playing')
    {
        modalStart.update();
        return;
    }

    difficultyTime--;
    if (difficultyTime <= 0)
    {
        difficultyTime = 5;
        difficulty++;
        if (difficulty > 600)
        {
            difficulty = 600;
            spawnTimeEnemy -= 0.01;
            if (spawnTimeEnemy < 0.5) spawnTimeEnemy = 0.5;
        }

    }

    for (var i = entities.length - 1; i >= 0; i--) {
        if (entities[i]) entities[i].update();
    }

    lastEnemySpawned += delta;
    if (lastEnemySpawned >= spawnTimeEnemy * 1000)
    {
        lastEnemySpawned = 0;
        var x = Math.randomBetween(0, canvas.width);
        var y = Math.randomBetween(0, canvas.height);
        var random = Math.random();
        // Top
        if (random <= 1 && random > .75)
        {
            y = -20;
        }
        // Right
        else if (random <= .75 && random > .5)
        {
            x = canvas.width + 20;
        }
        // Bottom
        else if (random <= .5 && random > .25)
        {
            y = canvas.height + 20;
        }
        // Left
        else
        {
            x = -20;
        }
        var r = Math.randomBetween(1, 7);
        entities.push(new Enemy(x, y, r));
    }

    lastFoodSpawned += delta;
    if (lastFoodSpawned >= spawnTimeFood * 1000 && foodCount < 4)
    {
        foodCount++;
        lastFoodSpawned = 0;
        var x = Math.randomBetween(10, canvas.width - 10);
        var y = Math.randomBetween(40, canvas.height - 10);
        entities.push(new Eatme(x, y));
    }
}

/**
 * Draw everything
 */
var draw = function()
{
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (state !== 'playing')
    {
        modalStart.draw();
        return;
    }

    for (var i = entities.length - 1; i >= 0; i--) {
        entities[i].draw();
    }
    header.draw();

    if (debug)
    {
        context.beginPath();
        context.fillStyle = "red";
        context.arc(player.x, player.y, 1, 0, 2 * Math.PI);
        context.fill();
        context.closePath();

        context.beginPath();
        context.fillStyle = "red";
        context.arc(reticle.x, reticle.y, 1, 0, 2 * Math.PI);
        context.fill();
        context.closePath();

        context.beginPath();
        context.fillStyle = "green";
        context.arc(mouse.x, mouse.y, 1, 0, 2 * Math.PI);
        context.fill();
        context.closePath();
    }

}

var header = {
    height: 30,
    healthBarWidth: 100,
    healthBarHeight: 4,
    draw: function()
    {
        context.shadowBlur = 0;
        context.fillStyle = "rgba(30, 30, 30, 1)";
        context.fillRect(0, 0, canvas.width, this.height);
        context.save();

        context.translate(10, 10);

        // Health bar

        context.fillStyle = "rgba(40, 40, 40, 0.8)";
        context.fillRect(0, 2, this.healthBarWidth, this.healthBarHeight);
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 14;
        context.shadowColor = "rgba(0, 240, 255, 0.9)";
        context.fillStyle = "rgba(0, 200, 220, 0.8)";
        context.fillRect(0, 2, player.health / player.maxHealth * this.healthBarWidth, this.healthBarHeight);

        // Multiplier

        context.translate(120, 0);
        context.shadowBlur = 0;
        context.fillStyle = "#ffffff";
        context.fillText("MULTIPLIER: ", 0, 8);
        context.translate(72, 0);
        context.fillStyle = "rgba(0, 200, 220, 0.8)";
        context.fillText(player.tail.length, 0, 8);

        // Score

        context.translate(20, 0);
        context.font = "10px Arial";
        context.fillStyle = "#ffffff";
        context.fillText("SCORE: ", 0, 8);
        context.translate(46, 0);
        context.fillStyle = "rgba(0, 200, 220, 0.8)";
        context.fillText(score, 0, 8);

        context.restore();
    }
}

// TODO: Make this more flexible
var Modal = function(settings)
{
    this.width = canvas.width / 2;
    this.height = canvas.height / 2;
    this.title = "INSTRUCTIONS";
    this.text1 = "Use the cursor to control yourself.";
    this.text2 = "Eat green things. Avoid red things.";
    this.button = "BEGIN";

    for (var setting in settings)
    {
        if (settings.hasOwnProperty(setting))
        {
            this[setting] = settings[setting];
        }
    }

    this.draw = function()
    {

        context.save();
        context.translate(canvas.width / 2 - this.width / 2, canvas.height / 2 - this.height / 2);
        context.translate(this.width / 2, -44);
        context.textAlign = "center";
        context.font = "38px Arial";
        context.fillStyle = "rgba(255,255,255,1)";
        context.fillText("MULTIPLY", 0, 0);
        context.restore();

        context.save();
        context.translate(canvas.width / 2 - this.width / 2, canvas.height / 2 - this.height / 2);
        context.fillStyle = "rgba(30, 30, 30, 0.1)";
        context.strokeStyle = "rgba(50, 50, 50, 0.5)";
        context.shadowBlur = 20;
        context.shadowColor = "rgba(0, 240, 255, 0.1)";
        context.fillRect(0, 0, this.width, this.height);
        context.strokeRect(0, 0, this.width, this.height);

        context.translate(this.width / 2, 30);
        context.textAlign = "center";
        context.font = "bold 18px Arial";
        context.fillStyle = "#ffffff";
        context.fillText(this.title, 0, 0);

        context.translate(0, 30);
        context.font = "12px Arial";
        context.fillText(this.text1, 0, 0);
        context.fillText(this.text2, 0, 20);

        context.translate(0, 90);
        context.font = "18px Arial";
        context.fillStyle = "rgba(0, 200, 220, 0.8)";
        context.shadowBlur = 20;
        context.shadowColor = "rgba(0, 240, 255, 0.6)";
        context.fillText(this.button, 0, 0);

        context.restore();
    }
    this.update = function() {}
}

/**
 * The main game loop
 */
var main = function()
{
    var now = Date.now();
    delta = now - then;

    fps = Math.round(1 / (delta / 1000));
    if (fps > 58) fps = 60;


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

// TODO: Fix this with the modal thing
var onMouseClick = function(event)
{
    if (state === 'start' || state === 'restart')
    {
        if (mouse.x > 280 && mouse.x < 420 && mouse.y > 230 && mouse.y < 280)
        {
            state = 'playing';
            reset();
        }
    }
}

/**
 * Math stuff
 */
Math.degToRad = function(angle) { return angle * Math.PI / 180; };
Math.radToDeg = function(angle) { return angle * 180 / Math.PI };
Math.randomBetween = function(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };

Number.prototype.between = function(min, max) { return this > min && this < max; };

combineRGBA = function(rgba)
{
    return "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")";
}

/**
 * ========== [ Entities ] =====================================================
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
        return { x: distance * Math.cos(angle) + this.x, y: distance * Math.sin(angle) + this.y };
    }
    this.getPointAlongAxis2 = function(angle, distance)
    {
        return { x: distance * Math.cos(Math.degToRad(angle)) + this.x, y: distance * Math.sin(Math.degToRad(angle)) + this.y };
    }
    this.getMidPoint = function(a, b)
    {
        return { x: (a.x + b.x) * .5, y: (a.y + b.y) * .5 };
    }
    this.add = function(p)
    {
        return { x: this.x + p.x, y: this.y + p.y };
    }
}

var Entity = function(x, y, radius)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 3;
    this.angle = 0;
    this.speed = 25;
    this.update = function() {};
    this.draw = function() {};
    this.getCentre = function()
    {
        return { x: this.x - this.radius, y: this.y - this.radius };
    }
    this.distanceTo = function(other)
    {
        context.beginPath();
        context.arc(this.x, this.y, 1, 0, 2*Math.PI);
        context.arc(other.x, other.y, 1, 0, 2*Math.PI);
        context.fill();
        var xd = (this.x) - (other.x);
        var yd = (this.y) - (other.y);
        return Math.sqrt(xd * xd + yd * yd);
    }
    this.angleTo = function(other)
    {
        return Math.atan2(other.getCentre().y - this.getCentre().y, other.getCentre().x - this.getCentre().x);
    }
    this.kill = function()
    {
        var index = entities.indexOf(this);
        if (index > -1) entities.splice(index, 1);
    }
}
Entity.prototype = new Point;

var Player = function(x, y, radius)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = 6;
    this.tail = [];
    this.decaying = [];
    this.endPoints = [];
    this.children = [];
    this.health = 100;
    this.maxHealth = 100;
    this.vulnerable = true;
    this.draw = function()
    {
        for (var i = this.decaying.length - 1; i >= 0; i--) {
            this.decaying[i].draw();
        }

        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.angle);

        // --------

        context.shadowBlur = 20;
        context.lineWidth = 2;
        context.fillStyle = "rgba(0, 255, 255, 0.9)";
        context.strokeStyle = "rgba(255, 255, 255, 0.4)";
        context.shadowColor = "rgba(0, 255, 255, 0.9)";
        context.beginPath();
        context.arc(0, 0, this.radius, .3 * Math.PI, 1.3 * Math.PI);
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(0, 0, this.radius, 0.7 * Math.PI, 1.7 * Math.PI);
        context.fill();
        context.stroke();

        // --------

        context.restore();

        for (var i = this.tail.length - 1; i >= 0; i--) {
            this.tail[i].draw();
        }
    };
    this.update = function()
    {
        if (this.distanceTo(reticle) > this.radius * 2)
        {
            this.angle = this.angleTo(reticle);

            this.interpolate(reticle.x, reticle.y, 0.1);
        }
        for (var i = this.tail.length - 1; i >= 0; i--) {
            this.tail[i].update();
        }
        for (var i = this.decaying.length - 1; i >= 0; i--) {
            this.decaying[i].update();
        }
    }
    this.getCentre = function()
    {
        return { x: this.x, y: this.y };
    }
    this.grow = function()
    {
        soundNom.get();
        this.health += this.tail.length + 1;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        score += 100 * (this.tail.length + 1);

        if (this.endPoints.length > 2)
        {
            this.endPoints = this.endPoints.slice(2);
        }

        var tempEndPoints = this.endPoints.slice(0);

        this.endPoints = [];

        for (var i = tempEndPoints.length - 1; i >= 0; i--) {
            if (Math.random() < 0.25)
            {
                var a = new Tail(tempEndPoints[i].x, tempEndPoints[i].y, Math.randomBetween(1, 5), 225, tempEndPoints[i]);
                var b = new Tail(tempEndPoints[i].x, tempEndPoints[i].y, Math.randomBetween(1, 5), 135, tempEndPoints[i]);
                this.tail.push(a);
                this.tail.push(b);
                this.endPoints.push(a);
                this.endPoints.push(b);
            }
            else
            {
                var a = new Tail(tempEndPoints[i].x, tempEndPoints[i].y, Math.randomBetween(1, 5), 0, tempEndPoints[i]);
                this.tail.push(a);
                this.endPoints.push(a);
            }
        }

    }
    this.damage = function(hit)
    {
        soundHit.get();
        this.health -= 20;
        if (this.health < 0)
        {
            this.health = 0;
            this.kill();
        }
        for (var i = hit.children.length - 1; i >= 0; i--) {
            hit.children[i].kill();
        }
        hit.kill();
    }
    this.kill = function()
    {
        this.health = 0;
        state = 'restart';
        reset();
    }
}
Player.prototype = new Entity;

var Reticle = function(x, y, radius)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = 2;
    this.draw = function()
    {
        context.strokeStyle = this.stroke;
        context.fillStyle = this.fill;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.shadowBlur = 20;
        context.lineWidth = 2;
        context.fillStyle = "rgba(255, 153, 0, 0.9)";
        context.strokeStyle = "rgba(255, 255, 255, 0.4)";
        context.shadowColor = "rgba(255, 153, 0, 0.9)";
        context.fill();
        context.stroke();
    }
    this.update = function()
    {
        this.interpolate(mouse.x, mouse.y, 0.9);
    }
}
Reticle.prototype = new Entity;

var Tail = function(x, y, radius, offsetAngle, target)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 3;
    this.offsetAngle = offsetAngle || 0;
    this.target = target || player;
    this.speed = 4;
    this.children = [];
    this.fillStyle = { r: 0, g: 255, b: 255, a: 0.9 };
    this.strokeStyle = { r: 255, g: 255, b: 255, a: 0.4 };
    this.shadowColor = { r: 0, g: 255, b: 255, a: 0.9 };
    this.dead = false;
    this.deadAngle = null;
    if (this.radius < 1) this.radius = 1;

    var parent = this.target;
    while (parent !== player)
    {
        parent.children.push(this);
        parent = parent.target;
    }

    this.draw = function()
    {
        context.strokeStyle = this.stroke;
        context.fillStyle = this.fill;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.shadowBlur = 20;
        context.lineWidth = 2;
        context.fillStyle = combineRGBA(this.fillStyle);
        context.strokeStyle = combineRGBA(this.strokeStyle);
        context.shadowColor = combineRGBA(this.shadowColor);
        context.fill();
        context.stroke();

        if (!this.dead)
        {
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineWidth = this.radius;
            context.quadraticCurveTo(this.getMidPoint(this, this.target).x, this.getMidPoint(this, this.target).y, this.target.x, this.target.y);
            context.stroke();
        }
    }
    this.update = function()
    {
        if (this.dead)
        {
            this.interpolate(this.deadAngle.x, this.deadAngle.y, 0.005);
            if (this.fillStyle.r > 0) this.fillStyle.r -= 5;
            if (this.fillStyle.g > 0) this.fillStyle.g -= 5;
            if (this.fillStyle.b > 0) this.fillStyle.b -= 5;
            if (this.fillStyle.a > 0) this.fillStyle.a -= 1/255;
            if (this.strokeStyle.r > 0) this.strokeStyle.r -= 5;
            if (this.strokeStyle.g > 0) this.strokeStyle.g -= 5;
            if (this.strokeStyle.b > 0) this.strokeStyle.b -= 5;
            if (this.strokeStyle.a > 0) this.strokeStyle.a -= 1/255;
            if (this.shadowColor.r > 0) this.shadowColor.r -= 5;
            if (this.shadowColor.g > 0) this.shadowColor.g -= 5;
            if (this.shadowColor.b > 0) this.shadowColor.b -= 5;
            if (this.shadowColor.a > 0) this.shadowColor.a -= 1/255;
            if (this.radius > 0) this.radius -= 1/255;
            if (this.fillStyle.a <= 0)
            {
                var index = player.decaying.indexOf(this);
                if (index > -1) player.decaying.splice(index, 1);
            }
        }
        else
        {
            var offset = this.target.getPointAlongAxis(this.target.angle + Math.degToRad(this.offsetAngle), this.radius * 2);
            if (this.target === player)
            {
                offset = this.target.getPointAlongAxis(this.target.angle + Math.degToRad(this.offsetAngle + 180), this.radius * 2);
            }
            this.temp = offset;
            if (this.distanceTo(this.target) > this.radius * 2)
            {
                this.angle = this.angleTo(this.target);

                this.interpolate(offset.x, offset.y, 0.2);
            }
        }
    }
    this.kill = function()
    {
        this.dead = true;
        this.deadAngle = this.getPointAlongAxis(this.angle + Math.degToRad(180), 50);
        if (player !== null)
        {
            var index = player.tail.indexOf(this);
            if (index > -1) player.tail.splice(index, 1);

            if (player.tail.length === 0)
            {
                player.endPoints = [player];
            }
            else
            {
                player.endPoints = [player.tail[player.tail.length - 1]];
            }

            player.decaying.push(this);
        }
    }
}
Tail.prototype = new Entity;

var Eatme = function(x, y, radius)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = 3;
    this.draw = function()
    {
        context.strokeStyle = this.stroke;
        context.fillStyle = this.fill;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.shadowBlur = 20;
        context.lineWidth = 2;
        context.fillStyle = "rgba(0, 255, 100, 0.9)";
        context.strokeStyle = "rgba(255, 255, 255, 0.4)";
        context.shadowColor = "rgba(0, 255, 100, 0.9)";
        context.fill();
        context.stroke();
    }
    this.update = function()
    {
        if (this.distanceTo(player) <= player.radius * 1.5)
        {
            foodCount--;
            player.grow();
            this.kill();
        }
    }
}
Eatme.prototype = new Entity;

var Enemy = function(x, y, radius)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = 3;
    this.destination = this.getPointAlongAxis(this.angleTo(player), 1000);
    this.speed = 1000;
    this.draw = function()
    {
        context.strokeStyle = this.stroke;
        context.fillStyle = this.fill;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.shadowBlur = 20;
        context.lineWidth = 2;
        context.fillStyle = "rgba(255, 100, 100, 0.9)";
        context.strokeStyle = "rgba(255, 255, 255, 0.4)";
        context.shadowColor = "rgba(255, 100, 100, 0.9)";
        context.fill();
        context.stroke();
    }
    this.update = function()
    {

        if (this.x < -20 || this.y < -20 || this.x > canvas.width + 20 || this.y > canvas.height + 20)
        {
            this.kill();
        }

        this.interpolate(this.destination.x, this.destination.y, 1 / (1000 - difficulty));


        for (var i = player.tail.length - 1; i >= 0; i--) {
            if (this.distanceTo(player.tail[i]) <= this.radius + player.tail[i].radius)
            {
                player.damage(player.tail[i]);
                this.kill();
            }
        }
    }
}
Enemy.prototype = new Entity;

/**
 * Audio
 */

var SoundPool = function(maxSize)
{
    var size = maxSize;
    var pool = [];
    this.pool = pool;
    var currentSound = 0;

    this.init = function(object)
    {
        if (object == "nomnom")
        {
            for (var i = 0; i < size; i++)
            {
                var a = new Audio("nomnom.mp3");
                a.volume = soundNomVolume;
                a.load();
                pool[i] = a;
            }
        }
        else if (object == "hit")
        {
            for (var i = 0; i < size; i++)
            {
                var a = new Audio("hit.mp3");
                a.volume = soundHitVolume;
                a.load();
                pool[i] = a;
            }
        }
        else if (object == "death")
        {
            for (var i = 0; i < size; i++)
            {
                var a = new Audio("death.mp3");
                a.volume = .12;
                a.load();
                pool[i] = a;
            }
        }
    }

    this.get = function()
    {
        if (pool[currentSound].currentTime == 0 || pool[currentSound].ended)
        {
            pool[currentSound].play();
        }
        currentSound = (currentSound + 1) % size;
    }
}