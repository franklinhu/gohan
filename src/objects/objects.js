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

var gohan = {};
gohan.canvas = {
    element: null,
    height: 0,
    objects: null,
    width: 0
};

gohan.flags = {
    gravity: false
};

gohan.init = function(canvasElem, flags) {
    this.canvas.element = canvasElem;
    this.canvas.width = canvasElem.width;
    this.canvas.height = canvasElem.height;
    this.canvas.objects = new Array();
    this.flags = jQuery.extend(this.flags, flags);
};

gohan.draw = function() {
    /* Make sure canvas is supported */
    var context = gohan.canvas.element.getContext("2d");

    /* Clear the canvas before each redraw */
    context.clearRect(0, 0, 500, 500);
    var objects = gohan.canvas.objects;

    for (var i = 0; i < objects.length; i++) {
        obj = objects[i];
        obj.fill();
        obj.step();
    }
};

gohan.utils = (function() {
    /* Data2D class */
    var Data2D = function(x, y) {
        this.x = x;
        this.y = y;
        this.add = function(other) {
            this.updateX(this.x + other.x);
            this.updateY(this.y + other.y);
        }
        this.updateX = function(newX) {
            this.x = newX;
        };
        this.updateY = function(newY) {
            this.y = newY;
        };
        this.dimension = 2;
        this.dot = function(other) {
            return (this.x * other.x) + (this.y * other.y);
        };
    };

    /* Vec2D class */
    var Vec2D = function(x, y) {
        Data2D.call(this, x, y);
        this.normalize = function() {
            mag = Math.sqrt((this.x * this.x) + (this.y * this.y));
            this.updateX(this.x/mag);
            this.updateY(this.y/mag);
        };
    };
    Vec2D.prototype = new Data2D;
    Vec2D.prototype.constructor = Vec2D;

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
        this.step = function(acceleration) {
            this.add(acceleration);
        }
    };
    Velocity2D.prototype = new Data2D;
    Velocity2D.prototype.constructor = Velocity2D;

    /* Acceleration2D class */
    Acceleration2D = function(x, y) {
        Data2D.call(this, x, y);
    };
    Acceleration2D.prototype = new Data2D;
    Acceleration2D.prototype.constructor = Acceleration2D;

    var utils = {
        Data2D: Data2D,
        Vec2D: Vec2D,
        Position2D: Position2D,
        Velocity2D: Velocity2D,
        Acceleration2D: Acceleration2D
    };
    return utils;
})();

/* Objects */
gohan.objects = (function() {
    /* GohanObject class */
    var GohanObject = function(position, velocity, context, angle, xRad, yRad) {
        this.position = jQuery.extend({}, position);
        this.velocity = jQuery.extend({}, velocity);
        if (gohan.flags.gravity) {
            this.acceleration = new Acceleration2D(0, 9.8);
        } else {
            this.acceleration = new Acceleration2D(0, 0);
        }
        this.context = context;
        this.angle = angle;
        this.xRadius = xRad;
        this.yRadius = yRad;
        this.step = function() {
            this.checkWallCollisions();
            this.checkCollisions();
            this.velocity.step(this.acceleration);
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
        this.checkCollisions = function () {
            /* FIXME: Do in non-naive way */
            var objects = gohan.canvas.objects;
            for (var j = 0; j < objects.length; j++) {
                obj = objects[j];
                
                if (obj != this) {
                    /* Distance between two circles 
                     * Distance = sqrt((x_1 - x_2)^2 + (y_1 - y_2)^2)
                     */
                    thisPos = this.position;
                    thatPos = obj.position;

                    /* Using simple operations instead of Math.sqrt, etc for speedup*/
                    xDiff = thisPos.x - thatPos.x;
                    yDiff = thisPos.y - thatPos.y;
                    distance = (xDiff * xDiff) + (yDiff * yDiff);
                    
                    /* If distance < radius_1 + radius_2, circles intersect 
                     * FIXME: Collisions for non-circles
                     */

                    radius = this.radius + obj.radius;
                    if (distance < radius * radius) {
                        thisVel = this.velocity;
                        thatVel = obj.velocity;

                        displacement = new gohan.utils.Vec2D(thisPos.x - thatPos.x, thisPos.y - thatPos.y);
                        displacement.normalize();
                        thisDot = thisVel.dot(displacement);
                        thatDot = thatVel.dot(displacement); 

                        thisVel.updateX(thisVel.x - (2 * displacement.x * thisDot));
                        thisVel.updateY(thisVel.y - (2 * displacement.y * thisDot));
                        thatVel.updateX(thatVel.x - (2 * displacement.x * thatDot));
                        thatVel.updateY(thatVel.y - (2 * displacement.y * thatDot));
                    }
                }
            }
        };
    };

    /* Circle class */
    var Circle = function(position, velocity, context, radius) {
        GohanObject.call(this, position, velocity, context, 0, radius, radius);
        this.radius = radius;
        this.fill = function() {
            var x = this.position.x;
            var y = this.position.y;
            var rad = this.radius;
            var angle = this.angle;
            var context = this.context;

            context.beginPath();
            context.arc(x, y, rad, 0, Math.PI * 2, false);
            
            context.moveTo(x, y);
            context.lineTo(x + rad * Math.cos(angle), y + rad * Math.sin(angle));
            context.closePath();

            context.strokeStyle = "#000";
            context.stroke();
        };
    };
    Circle.prototype = new GohanObject;
    Circle.prototype.constructor = Circle;

    /* Rectangle class */
    var Rectangle = function(position, velocity, width, height, context, angle) {
        /* Change position to be the center of the rectangle, for dealing
         * with collisions 
         * TODO: Change to bounding boxes
         * TODO: Add spinning on collisions 
         */
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
    Rectangle.prototype = new GohanObject;
    Rectangle.prototype.constructor = Rectangle;

    var objs = {
        GohanObject: GohanObject,
        Circle: Circle,
        Rectangle: Rectangle
    };
    return objs;
})();

