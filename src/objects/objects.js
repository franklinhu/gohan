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

Data2D = CClass.create(
    function(x, y) {
        return {
            x: x,
            y: y,
            dimension: 2
        };
    }
);

Position2D = Data2D.extend(
    function(x, y) {
        this._super(x, y);
    }
);

Velocity2D = Data2D.extend(
    function(x, y) {
        this._super(x, y);
    }
);

GohanObject = CClass.create(
    function(position, velocity) {
        return {
            position: position,
            velocity: velocity
        };
    }
);

Circle = GohanObject.extend(
    function(position, velocity, context, radius) {
        this._super(position, velocity);

        return {
            context: context,

            radius: radius,

            fill: function() {
                context.beginPath();
                context.arc(position.x, position.y, radius, 0, Math.PI * 2, false);
                context.closePath();
                context.strokeStyle = "#000";
                context.stroke();
            }
        }
    }
);
