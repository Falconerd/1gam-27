function Point(x, y)
{
    this.x = x || 0;
    this.y = y || 0;
}

function Entity(x, y, settings)
{
}
Entity.prototype = new Point;

function Player(x, y, settings)
{
    this.player = true;
}
Player.prototype = new Entity;

var someEntity = new Entity;
var player = new Player;