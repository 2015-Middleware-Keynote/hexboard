// "Borrowed from here: https://github.com/paulirish/demo/blob/master/js/multitouch.js"

var CanvasDrawr = function(options) {
    // grab canvas element
    var canvas = document.getElementById(options.id),
        ctxt = canvas.getContext("2d");

    canvas.style.width = '100%';
    //canvas.width = canvas.offsetWidth;
    canvas.height = (window.innerHeight - 75);
    canvas.width = (window.innerWidth);
    canvas.style.width = '';

    // set props from options, but the defaults are for the cool kids
    ctxt.lineWidth = options.size || Math.ceil(Math.random() * 35);
    ctxt.lineCap = options.lineCap || "round";
    ctxt.pX = undefined;
    ctxt.pY = undefined;

    var lines = [,,];
    var offset = $(canvas).offset();

    var self = {
        //bind click events
        init: function() {
            //set pX and pY from first click

            canvas.addEventListener('touchstart', self.preDraw, false);
            canvas.addEventListener('touchmove', self.draw, false);


        },

        preDraw: function(event) {

            $.each(event.touches, function(i, touch) {

                var id      = touch.identifier,
                    colors  = ["red", "green", "yellow", "blue", "magenta", "orangered"],
                    mycolor = colors[Math.floor(Math.random() * colors.length)];

                lines[id] = { x     : this.pageX - offset.left,
                              y     : this.pageY - offset.top,
                              color : mycolor
                           };
            });

            event.preventDefault();
        },

        draw: function(event) {
            var e = event, hmm = {};

            $.each(event.touches, function(i, touch) {
                var id = touch.identifier,
                    moveX = this.pageX - offset.left - lines[id].x,
                    moveY = this.pageY - offset.top - lines[id].y;

                var ret = self.move(id, moveX, moveY);
                lines[id].x = ret.x;
                lines[id].y = ret.y;
            });

            event.preventDefault();
        },

        move: function(i, changeX, changeY) {
            ctxt.strokeStyle = lines[i].color;
            ctxt.beginPath();
            ctxt.moveTo(lines[i].x, lines[i].y);

            ctxt.lineTo(lines[i].x + changeX, lines[i].y + changeY);
            ctxt.stroke();
            ctxt.closePath();

            return { x: lines[i].x + changeX, y: lines[i].y + changeY };
        }
    };

    return self.init();
};
