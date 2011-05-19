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
gohan.constants = {
    gravity: 9.8
};

gohan.canvas = {
    element: null,
    height: 0,
    objects: null,
    width: 0
};

gohan.flags = {
    gravity: false,
    walls: {
        0: true,
        1: true,
        2: true,
        3: true
    }
};

/**
 *  init
 *  @required arguments[0] object
 *      @required attributes:
 *          canvas
 *      @optional attributes:
 *          flags
 *              gravity: {true, false}, @default false
 *              walls
 *                  0: {true, false}, @default true, top
 *                  1: {true, false}, @default true, right
 *                  2: {true, false}, @default true, bottom
 *                  3: {true, false}, @default true, left
 *  @return void
 **/
gohan.init = function(/* arguments */) {
    var obj = arguments[0];
    if (obj.canvas) {
        this.canvas.element = obj.canvas;
        this.canvas.width = obj.canvas.width;
        this.canvas.height = obj.canvas.height;
        this.canvas.objects = new Array();
        if (obj.flags) {
            this.flags = jQuery.extend(this.flags, obj.flags);
        }
    } else {
        console.log("GOHAN ERROR: init missing canvas argument");
    }

    /* Create walls if necessary */
};

/**
 *  findCollisions
 *  @return Array of unique pairs of colliding objects
 **/
gohan.findCollisions = function() {
    var objects = gohan.canvas.objects;
    var thisObj = null, thatObj = null;
    var collisions = [];
    for (var j = 0; j < objects.length; j++) {
        thisObj = objects[j];
        thisObj.sanityCheck();
        for (var k = j + 1; k < objects.length; k++) {
            thatObj = objects[k];
            thatObj.sanityCheck();

            if(thisObj.collidesWith(thatObj)) {
                collisions.push([thisObj, thatObj]);
            }
        }
    }
    return collisions;
};

/**
 *  resolveCollision
 *  @param pair of colliding objects
 *  @return void
 **/
gohan.resolveCollision = function(pair) {
    var obj0 = pair[0];
    var obj1 = pair[1];
    if (obj0.fixed) {
        obj0.resolveCollision(obj1);
    } else {
        obj1.resolveCollision(obj0);
    }
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

gohan.step = function() {
    var pairs = gohan.findCollisions();
    for (var i = 0; i < pairs.length; i++) {
        gohan.resolveCollision(pairs[i]);
    }
    gohan.draw();
};

gohan.physics = {
    /**
     *  elasticCollision
     *       (m1 - m2)        (2m2)
     *  v1 = --------- u1 + --------- u2
     *       (m1 + m2)      (m1 + m2)
     *
     *       (m2 - m1)        (2m1)
     *  v2 = --------- u2 + --------- u1
     *       (m1 + m2)      (m1 + m2)
     **/
    elasticCollision: function(m1, m2, u1, u2) {
        var sum = m1 + m2,
            c1 = (m1 - m2) / sum,
            c2 = 2 * m2 / sum,
            c3 = (m2 - m1) / sum,
            c4 = 2 * m1 / sum;

        var a = u1.mult(c1),
            b = u2.mult(c2),
            c = u2.mult(c3),
            d = u1.mult(c4);
            
        a.addi(b);
        c.addi(d);
        return [a, c];
    }
};

gohan.utils = (function() {
    /* Data2D class */
    var Data2D = function(x, y) {
        this.x = x;
        this.y = y;
        this.add = function(other) {
            var newObj = gohan.copy(this);
            newObj.x += other.x;
            newObj.y += other.y;
            return newObj;
        };
        this.addi = function(other) {
            this.updateX(this.x + other.x);
            this.updateY(this.y + other.y);
        };
        this.mult = function(multiplier) {
            var newObj = gohan.utils.copy(this);
            newObj.x *= multiplier;
            newObj.y *= multiplier;
            return newObj;
        };
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
        this.squareDistanceTo = function(other) {
            var x = this.x - other.x;
            var y = this.y - other.y;
            return x * x + y * y;
        };
        this.vectorTo = function(other) {
            return new Vec2D(other.x - this.x, other.y - this.y);
        };
    };
    Position2D.prototype = new Data2D;
    Position2D.prototype.constructor = Position2D;

    /* Velocity2D class */
    var Velocity2D = function(x, y) {
        Data2D.call(this, x, y);
        this.step = function(acceleration) {
            this.addi(acceleration);
        };
    };
    Velocity2D.prototype = new Data2D;
    Velocity2D.prototype.constructor = Velocity2D;

    /* Acceleration2D class */
    var Acceleration2D = function(x, y) {
        Data2D.call(this, x, y);
    };
    Acceleration2D.prototype = new Data2D;
    Acceleration2D.prototype.constructor = Acceleration2D;

    /* Force2D class */
    var Force2D = function(x, y, ttl) {
        Data2D.call(this, x, y);
        this.ttl = ttl;
    };
    Force2D.prototype = new Data2D;
    Force2D.prototype.constructor = Force2D;

    var gravity = new Force2D(0, gohan.constants.gravity, -1);

    var copy = function(obj) {
        return jQuery.extend({}, obj);
    };

    var utils = {
        Data2D: Data2D,
        Vec2D: Vec2D,
        Position2D: Position2D,
        Velocity2D: Velocity2D,
        Acceleration2D: Acceleration2D,
        Force2D: Force2D,

        gravity: gravity,

        copy: copy
    };
    return utils;
})();

/* Objects */
gohan.objects = (function() {
    /* GohanObject class */
    var GohanObject = function(position, velocity, context, angle, xRad, yRad) {
        this.position = gohan.utils.copy(position);
        this.velocity = gohan.utils.copy(velocity);
        this.forces = {
            objs: [],
            acceleration: new gohan.utils.Acceleration2D(0, 0),
            dirty: true
        };
        if (gohan.flags.gravity) {
            this.forces.objs.push(gohan.utils.gravity);
        }
        this.context = context;
        this.angle = angle;
        this.xRadius = xRad;
        this.yRadius = yRad;
        this.fixed = false;


        /* Methods */
        this.sanityCheck = function() {
           if (!this.velocity) {
                throw new Error("NO VELOCITY");
            }
        };
        this.step = function() {
            this.sanityCheck();
            this.checkWallCollisions();
            this.resolveForces();
            this.velocity.step(this.forces.acceleration);
            this.position.step(this.velocity);
        };
        this.collidesWith = function(other) {
            /* Check bounding sphere */
            var squareDistance = this.position.squareDistanceTo(other.position);
            var radius = this.maxRadius + other.maxRadius;
            if (squareDistance > radius * radius) {
                /* Not in bounding sphere, not colliding */
                return false;
            }

            /* FIXME: Possibly colliding, 
               since circles, assume colliding for now */
            return true;
        };
        this.resolveCollision = function(other) {
            /* FIXME: Collisions for non circles */

            var thisVel = this.velocity;
            var thatVel = other.velocity;
            var thisPos = this.position;
            var thatPos = other.position;

            var v1v2 = gohan.physics.elasticCollision(this.radius, other.radius, this.velocity, other.velocity);
            this.velocity = v1v2[0];
            other.velocity = v1v2[1];
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
        this.radiusAt = function(angle) {
            console.log("GOHAN ERROR: unimplemented radiusAt method");
        };
        this.radiusMax = function() {
            console.log("unimplemented radiusMax in rectangle");
        };
        this.addForce = function(force) {
            this.forces.objs.push(gohan.copy(force));
            this.forces.dirty = true;
        };
        this.removeForce = function(force) {
            /* FIXME make O(1) */
            var forces = this.forces.objs;
            var i = 0;
            for(; i < forces.length; i++) {
                if (forces[i] === force) {
                    break;
                }
            }
            if (i < forces.length) {
                forces.splice(i, 1);
            }
            this.forces.dirty = true;
        };

        /* Remove forces with ttl == 0 */
        this.removeDeadForces = function() {
            var forces = this.forces.objs;
            var newForces = [];
            var force = null;
            for(var i = 0; i < forces.length; i++) {
                force = forces[i];
                if(force.ttl !== 0) {
                    force.ttl -= 1;
                    newForces.push(force);
                }
            }
            this.forces.objs = newForces;
        };

        this.resolveForces = function () {
            this.removeDeadForces();
            var forces = this.forces.objs;
            var acc = this.forces.acceleration;
            acc.updateX(0);
            acc.updateY(0);

            for(var i = 0; i < forces.length; i++) {
                acc.addi(forces[i]);
            }
        };

        this.sanityCheck();
    };

    /* Circle class */
    var Circle = function(position, velocity, context, radius) {
        GohanObject.call(this, position, velocity, context, 0, radius, radius);
        this.radius = radius;
        this.maxRadius = radius;
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
        this.radiusAt = function(angle) {
            return this.radius;
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
        var xRad = width/2;
        var yRad = height/2;
        position.updateX(position.x + xRad);
        position.updateY(position.y + yRad);
        
        GohanObject.call(this, position, velocity, context, angle, xRad, yRad);

        this.width = width;
        this.height = height;
        this.maxRadius = Math.sqrt(xRad * xRad + yRad * yRad);

        /* Methods */
        this.fill = function() {
            context.save();
            context.rotate(this.angle);
            context.fillRect(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height);
            context.restore();

        };
        this.radiusAt = function(angle) {
            console.log("TODO fix rectangle radius at");
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

