/* objects.js */

/* Javascript OOP Helper by Steffen Rusitschka
 * http://www.ruzee.com/blog/2008/12/javascript-inheritance-via-prototypes-and-closures
 */
(function(){
    CClass = function(){};
    CClass.create = function(constructor) {
        var k = this;
        c = function() {
            this._super = k;
            var pubs = constructor.apply(this, arguments), self = this;
            for (key in pubs) (function(fn, sfn) {
                self[key] = typeof fn != "function" || typeof sfn != "function" ? fn :
                function() { this._super = sfn; return fn.apply(this, arguments); };
            })(pubs[key], self[key]);
        }; 
        c.prototype = new this;
        c.prototype.constructor = c;
        c.extend = this.extend || this.create;
        return c;
    };
})();

var gohan = {
    canvas: {
        width: 0,
        height: 0,
        element: null
    },
    init: function(canvasElem) {
        this.canvas.element = canvasElem;
        this.canvas.width = canvasElem.width();
        this.canvas.height = canvasElem.height();
    },
    utils: (function() {
        /* Data2D class */
        var Data2D = function(x, y) {
            this.x = x;
            this.y = y;
            this.updateX = function(newX) {
                this.x = newX;
            };
            this.updateY = function(newY) {
                this.y = newY;
            };
            this.dimension = 2;
        };

        /* Position2D class */
        var Position2D = function(x, y) {
            Data2D.call(this, x, y);
            this.step = function(v) {
                this.updateX(this.x + v.x);
                this.updateY(this.y + v.y);
            };
        };
        Position2D.prototype = new Data2D;
        Position2D.prototype.constructor = Position2D;

        /* Velocity2D class */
        Velocity2D = function(x, y) {
            Data2D.call(this, x, y);
        };
        Velocity2D.prototype = new Data2D;
        Velocity2D.prototype.constructor = Velocity2D;

        var utils = {
            Data2D: Data2D,
            Position2D: Position2D,
            Velocity2D: Velocity2D
        };
        return utils;
    })(),

    /* Objects */
    objects: (function() {
        var GohanObject = function(position, velocity, context, angle, xRad, yRad) {
            this.position = position;
            this.velocity = velocity;
            this.context = context;
            this.angle = angle;
            this.xRadius = xRad;
            this.yRadius = yRad;
            this.step = function() {
                this.checkWallCollisions();
                this.position.step(this.velocity);
            };
            this.checkWallCollisions = function() {
                /* If object collides with wall, reverse velocity */
                var pos = this.position;
                var vel = this.velocity;
                if (pos.x - xRad < 0 && vel.x < 0) {
                    vel.updateX(-vel.x);
                } else if (pos.y + yRad > gohan.canvas.height && vel.y > 0) {
                    vel.updateY(-vel.y);
                } else if (pos.x + xRad > gohan.canvas.width && vel.x > 0) {
                    vel.updateX(-vel.x);
                } else if (pos.y - yRad < 0 && vel.y < 0) {
                    vel.updateY(-vel.y);
                }
            };
        };

        var Circle = function(position, velocity, context, radius) {
            GohanObject.call(this, position, velocity, context, 0, radius, radius);
            this.radius = radius;
            this.fill = function() {
                this.context.beginPath();
                this.context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
                this.context.closePath();
                this.context.strokeStyle = "#000";
                this.context.stroke();
            };
        };
        Circle.prototype = new GohanObject;
        Circle.prototype.constructor = Circle;

        var Rectangle = function(position, velocity, width, height, context, angle) {
            position.updateX(position.x + width/2);
            position.updateY(position.y + height/2);
            GohanObject.call(this, position, velocity, context, angle, width/2, height/2);
            this.width = width;
            this.height = height;
            this.fill = function() {
                context.save();
                context.rotate(this.angle);
                context.fillRect(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
                context.restore();

            };
        };

        var objs = {
            GohanObject: GohanObject,
            Circle: Circle,
            Rectangle: Rectangle
        };
        return objs;
    })()
};

