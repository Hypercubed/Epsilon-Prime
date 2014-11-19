'use strict';

/**
 * @ngdoc overview
 * @name myApp
 * @description
 * # myApp
 *
 * Main module of the application.
 */
angular
  .module('myApp', [
    'ngAnimate',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'components/main/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'components/about/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
