angular.module('starter.controllers', [])

.controller('MainCtrl', function($scope, $rootScope, $state) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.goToDraw = function (name) {

    $rootScope.name = name;

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

.controller('DrawCtrl', function ($scope, $rootScope, $state, $http) {
  $scope.$on('$ionicView.enter', function(e) {
    if ('ontouchstart' in window) {
    /* browser with Touch Events
       running on touch-capable device */
       $scope.super_awesome_multitouch_drawing_canvas_thingy = new CanvasDrawr({id:"example", size: 15 });
    } else {
      $scope.super_awesome_multitouch_drawing_canvas_thingy = new CanvasDrawrMouse({id:"example", size: 15 });
    }
    var canvas = document.querySelector('canvas'),
      ctx = canvas.getContext("2d");

    $scope.backAndClear = function () {
      ctx.clearRect(0,0, document.width, document.height);
    };

    $scope.submitToContainer = function () {
      // Submit to container then on success go to the List Page
      $http({
        method: 'POST'
      , url: '/api/sketch/1?name=' + $rootScope.name
      , headers: {'Content-Type': 'image/png'}
      , transformRequest: angular.identity
      , data: canvas.toDataURL()
      }).success(function (data) {
        console.log('success. data:', data);
        // Need the container link
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
        , sketch: data
        });

        items = JSON.stringify(items);

        // Save to the local storage
        localStorage.setItem('keynote2015-mobile-app', items);
        $state.go('list');
      });
    };
  });
});
