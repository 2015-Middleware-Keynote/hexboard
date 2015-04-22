'use strict';

var rawfeed = rawfeed || {};

d3demo.layout = (function dataSimulator(d3, Rx) {

  var width = d3demo.layout.width
    , height = d3demo.layout.height
    , locations = d3demo.layout.locations;

  var i = 0;

  var forceLocation = null
    , forceLabel = null
    , nodes = null
    , labelAnchors = []
    , labelAnchorLinks = []
    , dataNodes
    , foci = null;

  var svg = d3.select('.map').append('svg')
    .attr('width', width)
    .attr('height', height);

  locations.forEach(function(location, index) {
    location.count = 0;
    labelAnchors.push({ node: location });
    labelAnchors.push({ node: location });
    labelAnchorLinks.push({
					source : index * 2,
					target : index * 2 + 1,
					weight : 1
		});
  });

  function particle(location) {
      svg.insert('circle', 'rect')
        .attr('cx', getRandomInt(1, width))
        .attr('cy', getRandomInt(1, height))
        .attr('r', 100)
        .style('stroke', d3.hsl(((location.id * 30) % 360), 1, .5))
        .style('stroke-opacity', .4)
      .transition()
        .duration(1000)
        .ease('quad-in')
        .attr('cx', location.x)
        .attr('cy', location.y)
        .attr('r', 1e-6)
        .style('stroke-opacity', 1)
        .remove();
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var dataNodes = locations;

  forceLocation = d3.layout.force()
      .size([width, height])
      .nodes(dataNodes)
      .links([])
      .charge(function(d) {
        return -Math.max(1000, Math.sqrt(d.count)* 100);
  });

  forceLabel = d3.layout.force()
      .size([width, height])
      .nodes(labelAnchors)
      .links(labelAnchorLinks)
      .gravity(0)
      .linkDistance(0)
      .linkStrength(8)
      .charge(-100)
      ;

  nodes = svg.selectAll('.node')
    .data(dataNodes)
    .enter().append('circle')
    .attr('class', 'node')
    .attr('r', 2)
    .style('fill', function(d) { return d3.hsl(((d.id * 30) % 360), 1, .5)})
    .attr('cx', function(d) { return d.x; })
    .attr('cy', function(d) { return d.y; });

  var anchorLinks = svg.selectAll("line.anchorLink").data(labelAnchorLinks);

  var anchorNodes = svg.selectAll("g.anchorNode")
    .data(forceLabel.nodes())
    .enter()
    .append("svg:g")
    .attr("class", "anchorNode");

	anchorNodes.append("svg:circle").attr("r", 0).style("fill", "#FFF");
	anchorNodes.append("svg:text").text(function(d, i) {
	   return i % 2 == 0 ? "" : d.node.name
	}).style("fill", "#555");

  forceLocation.on('tick', function() {
    nodes
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', function(d) {return Math.max(5, 50 * Math.log(1 + d.count / 40))})
    anchorNodes.each(function(d, i) {
      if(i % 2 == 0) {
						d.x = d.node.x;
						d.y = d.node.y;
					} else {
						var b = this.childNodes[1].getBBox();

						var diffX = d.x - d.node.x;
						var diffY = d.y - d.node.y;

						var dist = Math.sqrt(diffX * diffX + diffY * diffY);

						var shiftX = b.width * (diffX - dist) / (dist * 2);
						shiftX = Math.max(-b.width, Math.min(0, shiftX));
						var shiftY = 5;
						this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
					}
		});

    anchorNodes.attr("transform", function(d) {
		    return "translate(" + d.x + "," + d.y + ")";
		});

    anchorLinks.attr("x1", function(d) {
					return d.source.x;
				}).attr("y1", function(d) {
					return d.source.y;
				}).attr("x2", function(d) {
					return d.target.x;
				}).attr("y2", function(d) {
					return d.target.y;
				});
  });

  forceLocation.start();
  forceLabel.start();

  Rx.Observable.interval(25).map(function() {
    var location = locations[getRandomInt(0, locations.length)];
    location.count++;
    particle(location);
    forceLocation.start();
    forceLabel.start();
  }).take(10000).subscribe();

})(d3, Rx);
