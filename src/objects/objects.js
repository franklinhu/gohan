/* objects.js */

Data2D = function(x, y) {
    this.x = x;
    this.y = y;
}
Data2D.prototype.constructor = Data2D;
Data2D.prototype.dimension = function() { return 2; }
Data2D.prototype.getX = function() { return this.x; }
Data2D.prototype.getY = function() { return this.y; }

Position2D = function(x, y) {
    Data2D(x, y);
}
Position2D.prototype = new Data2D;
Position2D.prototype.constructor = Position2D;

Velocity2D = function(x, y) {
    Data2D(x, y);
}
Velocity2D.prototype = new Data2D;
Velocity2D.prototype.constructor = Velocity2D;

GohanObject = function(position, velocity) {
    this.position = position;
    this.velocity = velocity;
}
GohanObject.prototype.constructor = GohanObject;
GohanObject.prototype.getPosition = function() { return this.position; }
GohanObject.prototype.getVelocity = function() { return this.velocity; }

Circle = function(position, velocity, context, radius) {
    GohanObject(position, velocity);
    this.context = context;
    this.radius = radius;
}
Circle.prototype = new GohanObject;
Circle.prototype.constructor = Circle;
Circle.prototype.fill = function() {
    var position = this.getPosition();
    this.context.beginPath();
    this.context.arc(position.getX(), position.getY(), this.radius, 0, Math.PI * 2, false);
    this.context.closePath();
    this.context.strokeStyle = "#000";
    this.context.stroke();
}

