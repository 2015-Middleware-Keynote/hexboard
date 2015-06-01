'use strict';

var d3demo = d3demo || {};

d3demo.controls = (function controls(d3, Rx) {
  var pause = Rx.Observable.fromEvent(d3.select('#pause').node(), 'click')
    , play = Rx.Observable.fromEvent(d3.select('#play').node(), 'click')
    , step = Rx.Observable.fromEvent(d3.select('#step').node(), 'click')
    ;

  play.tap(function() {
    d3demo.playback.resume();
  })
  .subscribeOnError(errorHandler);

  step.tap(function() {
    d3demo.playback.pause();
    d3demo.playback.step();
  })
  .subscribeOnError(errorHandler);

  pause.tap(function() {
    d3demo.playback.pause();
  })
  .subscribeOnError(errorHandler);

  var nodeClick = Rx.Observable.fromEvent(d3.select('.map').node(), 'click')
    , autocomplete = Rx.Observable.fromEvent(d3.select('#filter').node(), 'keyup')
    , typeaheadClick = Rx.Observable.fromEvent(d3.select('.typeahead').node(), 'click')
    ;

  nodeClick.filter(function(event) {
    return event.target && event.target.nodeName !== 'circle';
  })
  .tap(function(event) {
    d3demo.visualisation.unSelectNodes();
    d3demo.visualisation.hideUserInfoPanel();
    hideComboBox();
  })
  .subscribeOnError(errorHandler);

  nodeClick.filter(function(event) {
    return event.target && event.target.nodeName === 'circle';
  })
  .tap(function(event) {
    d3demo.visualisation.unSelectNodes();
    hideComboBox();
    var node = d3.select(event.target);
    d3demo.visualisation.selectNodes(node);
    d3demo.forcemap.start();
  })
  .subscribeOnError(errorHandler);

  autocomplete.filter(function(event) {
    return [13, 38, 40].indexOf(event.keyCode) > -1;
  }).tap(function(event) {
    moveActiveOption(event);
    return false;
  })
  .subscribeOnError(errorHandler);

  autocomplete.map(function(event) {
    return (event.target.value);
  })
  .debounce(250)
  .distinctUntilChanged()
  .tap(function(filterValue) {
    d3demo.visualisation.unSelectNodes();
    if (filterValue.length === 0) {
      d3demo.visualisation.hideUserInfoPanel();
      return;
    }
    var selectedNodes = d3demo.forcemap.getNodesByName(filterValue);
    populateComboBox(selectedNodes.data());
    if (selectedNodes[0].length > 0) {
      d3demo.visualisation.selectNodes(selectedNodes);
    } else {
      d3demo.visualisation.hideUserInfoPanel();
    }
  })
  .subscribeOnError(errorHandler);

  var populateComboBox = function(data) {
    d3.timer(function() {
      var typeahead = d3.select('.typeahead').style({'display': 'block'}).node();
      while (typeahead.firstChild) {
        typeahead.removeChild(typeahead.firstChild);
      };
      if (data.length <= 1) {
        var typeahead = d3.select('.typeahead').style({'display': 'none'}).node;
      } else {
        data.forEach(function(d) {
          var option = document.createElement('li');
          var link = document.createElement('a');
          link.href="#";
          link.textContent = d.user.name + ' (id: '+d.user.id+ (d.beaconId ? ', beacon: '+d.beaconId+')' : ')');
          link.dataset.userid = d.user.id;
          option.appendChild(link);
          typeahead.insertBefore(option, typeahead.firstChild);
        })
      };
      return true;
    });
  };

  var selectOptionById = function(id) {
    var node = d3demo.forcemap.getNodeById(id);
    hideComboBox();
    d3demo.visualisation.unSelectNodes();
    d3demo.visualisation.selectNodes(node);
  };

  var hideComboBox = function() {
    d3.timer(function() {
      var typeahead = d3.select('.typeahead').style({'display': 'none'}).node;
      while (typeahead.firstChild) {
        typeahead.removeChild(typeahead.firstChild);
      };
      return true;
    });
  };

  typeaheadClick.tap(function(event) {
    var link = d3.select(event.target);
    var id = link.node().dataset.userid;
    selectOptionById(id);
  })
  .subscribeOnError(errorHandler);

  var moveActiveOption  = function(event) {
    var typeahead = d3.select('.typeahead');
    var activeOption = typeahead.select('.active').node();
    typeahead = typeahead.node();
    if (activeOption) {
      activeOption.className = '';
    }
    var nextOption;
    switch (event.keyCode) {
      case 38: // down
        nextOption = activeOption ? activeOption.previousSibling : typeahead.lastChild;
        break;
      case 40: // up
        nextOption = activeOption ? activeOption.nextSibling : typeahead.firstChild;
        break;
      case 13:
        if (activeOption) {
          var id = activeOption.firstChild.dataset.userid;
          selectOptionById(id);
        }
        event.preventDefault();
        break;
    }
    if (nextOption) {
      nextOption.className = 'active';
      d3.timer(function() {
        var boxHeight = (Math.floor(typeahead.offsetHeight / typeahead.firstChild.offsetHeight) - 1) * typeahead.firstChild.offsetHeight;
        var scrollDelta = nextOption.offsetTop - typeahead.scrollTop;
        if (scrollDelta < 0) {
          typeahead.scrollTop = nextOption.offsetTop - boxHeight;
        } else if (scrollDelta > boxHeight) {
          typeahead.scrollTop = nextOption.offsetTop;
        }
        return true;
      });
    }
  };

  var errorHandler = function (err) {
    console.log(err.stack);
  };

  return {

  }
})(d3, Rx);
