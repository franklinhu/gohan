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
    }
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
    function(position, velocity, context, angle) {
        return {
            position: position,
            velocity: velocity,
            context: context,
            angle: angle,
            step: function () {
                this.position.step(this.velocity);        
            }
        };
    }
);

Circle = GohanObject.extend(
    function(position, velocity, context, radius) {
        this._super(position, velocity, context, 0);

        return {
            radius: radius,
            fill: function() {
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
        this._super(position, velocity, context, angle);

        return {
            fill: function() {
                context.save();
                context.rotate(this.angle);
                context.fillRect(this.position.x, this.position.y, width, height);
                context.restore();
            }
        }
    }
);

