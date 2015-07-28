angular.module('starter.controllers', [])

.controller('MainCtrl', function($scope, $rootScope, $state) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.goToDraw = function (name) {
    $rootScope = {
      name: name
    };

    // Go To the Draw Page
    $state.go('draw');
  };
})

.controller('ListCtrl', function($scope) {
  $scope.$on('$ionicView.enter', function(e) {
    var items = localStorage.getItem('keynote2015-mobile-app');
    try {
      items = JSON.parse(items);
    } catch (err) {
      items = {containers: []};
    }
    $scope.containers = items.containers;
  });
})

.controller('DrawCtrl', function ($scope, $state) {

  var canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d'),
    oldX = 0,
    oldY = 0,
    originX = canvas.offsetLeft,
    originY = canvas.offsetTop;
  var currentColor = [];

  var colors = {
        "0": "black",
        "1": "blue",
        "2": "green",
        "3": "red",
        "4": "white",
        "5": "yellow"
    };

    canvas.height = (window.innerHeight - 75);
    canvas.width = (window.innerWidth);
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';

    ctx.translate( -originX, -originY );

  var touchstart = function (evt) {
    evt.preventDefault();

    var max = 5,
      min = 0;

    currentColor = colors[Math.floor(Math.random() * (max - min + 1)) + min];
  };

  var touchend = function (evt) {
    evt.preventDefault();
    oldX = 0;
    oldY = 0;
  };

  var touchmove = function (evt) {
    evt.preventDefault();
    var x = evt.changedTouches[ 0 ].clientX,
      y = evt.changedTouches[ 0 ].clientY;

      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      if (oldX > 0 && oldY > 0) {
          ctx.moveTo(oldX, oldY);
      }
      ctx.lineTo(x + 1, y + 1);
      ctx.stroke();
      ctx.closePath();

      oldX = x;
      oldY = y;
  };

  canvas.addEventListener( "touchstart", touchstart, false );
  canvas.addEventListener( "touchend", touchend, false );
  canvas.addEventListener( "touchmove", touchmove, false );


  $scope.backAndClear = function () {
    ctx.clearRect(0,0, document.width, document.height);
  };

  $scope.submitToContainer = function () {
    // Submit to container then on success go to the List Page
    var items = localStorage.getItem('keynote2015-mobile-app');

    if (!items) {
      items = {containers: []};
    }

    try {
      items = JSON.parse(items);
    } catch (err) {
      items = {containers: []};
    }

    items.containers.push({
      img: canvas.toDataURL()
    });

    items = JSON.stringify(items);

    localStorage.setItem('keynote2015-mobile-app', items);
    $state.go('list');
  };
});


