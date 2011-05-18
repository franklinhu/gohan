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
    objects: (function() {
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

        var Position2D = function(x, y) {
            Data2D.call(this, x, y);
            this.step = function(v) {
                this.updateX(this.x + v.x);
                this.updateY(this.y + v.y);
            };
        };
        Position2D.prototype = new Data2D;
        Position2D.prototype.constructor = Position2D;

        Velocity2D = function() { };
        Velocity2D.prototype = new Data2D;

        var objs = {
            Data2D: Data2D,
            Position2D: Position2D,
            Velocity2D: Velocity2D
        };
        return objs;
    })()
};

Data2D = CClass.create(
    function(x, y) {
        return {
            x: x,
            y: y,
            updateX: function(newX) {
                this.x = newX;
            },
            updateY: function(newY) {
                this.y = newY;
            },
            dimension: 2
        };
    }
);

Position2D = Data2D.extend(
    function(x, y) {
        this._super(x, y);

        return {
            step: function(v) {
                this.updateX(this.x + v.x);
                this.updateY(this.y + v.y);
            }
        }
    }
);

Velocity2D = Data2D.extend(
    function(x, y) {
        this._super(x, y);
    }
);

GohanObject = CClass.create(
    function(position, velocity, context, angle, xRad, yRad) {
        return {
            position: position,
            velocity: velocity,
            context: context,
            angle: angle,
            xRadius: xRad,
            yRadius: yRad,
            step: function () {
                this.checkWallCollisions();
                this.position.step(this.velocity);        
            },
            checkWallCollisions: function () {
                /* If object collides with wall, reverse velocity */
                if (position.x - xRad < 0 && velocity.x < 0) {
                    this.velocity.updateX(-this.velocity.x);
                } else if (position.y + yRad > gohan.canvas.height && velocity.y > 0) {
                    this.velocity.updateY(-this.velocity.y);
                } else if (position.x + xRad > gohan.canvas.width && velocity.x > 0) {
                    this.velocity.updateX(-this.velocity.x);
                } else if (position.y - yRad < 0 && velocity.y < 0) {
                    this.velocity.updateY(-this.velocity.y);
                }
            }
        };
    }
);

Circle = GohanObject.extend(
    function(position, velocity, context, radius) {
        this._super(position, velocity, context, 0, radius, radius);

        return {
            radius: radius,
            fill: function() {
                console.log(this.position);
                context.beginPath();
                context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
                context.closePath();
                context.strokeStyle = "#000";
                context.stroke();
            }
        }
    }
);

Rectangle = GohanObject.extend(
    function(width, height, position, velocity, context, angle) {
        position.updateX(position.x + width/2);
        position.updateY(position.y + height/2);
        this._super(position, velocity, context, angle, width/2, height/2);

        return {
            fill: function() {
                context.save();
                context.rotate(this.angle);
                context.fillRect(this.position.x - width/2, this.position.y - height/2, width, height);
                context.restore();
            }
        }
    }
);

