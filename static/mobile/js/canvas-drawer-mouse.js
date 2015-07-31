var CanvasDrawrMouse = function (options) {
    // get canvas 2D context and set him correct size
    var canvas = document.getElementById(options.id),
        ctx = canvas.getContext("2d");

     var colors  = ["red", "green", "yellow", "blue", "magenta", "orangered"],
        mycolor;

    canvas.style.width = '100%';
    canvas.height = (window.innerHeight - 75);
    canvas.width = (window.innerWidth);
    canvas.style.width = '';

    // set props from options, but the defaults are for the cool kids
    ctx.lineWidth = options.size || Math.ceil(Math.random() * 35);
    ctx.lineCap = options.lineCap || "round";

    // last known position
    var pos = { x: 0, y: 0 };

    document.addEventListener('mousemove', draw);
    document.addEventListener('mousedown', setPosition);
    //document.addEventListener('mouseenter', setPosition);

    // new position from mouse event
    function setPosition(e) {
      e.preventDefault();
      e.stopPropagation();
      pos.x = e.clientX;
      pos.y = e.clientY;

      mycolor = colors[Math.floor(Math.random() * colors.length)];
      console.log('setposition');
    }

    function draw(e) {
      e.preventDefault();
      e.stopPropagation();
      // mouse left button must be pressed
      if (e.buttons !== 1) return;

      ctx.beginPath(); // begin

      ctx.strokeStyle = mycolor;

      ctx.moveTo(pos.x, pos.y); // from
      pos.x = e.clientX;
      pos.y = e.clientY;
      ctx.lineTo(pos.x, pos.y); // to

      ctx.stroke(); // draw it!

    }
};
