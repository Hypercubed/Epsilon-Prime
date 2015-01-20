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
    'ngMessages',
    'ngTouch',
    'ui.ace',
    'ui.bootstrap',
    'xeditable',
    'LocalStorageModule'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'components/main/main.html',
        controller: 'MainCtrl as main'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(function($logProvider){
    $logProvider.debugEnabled(true);
  })
  .config(function (localStorageServiceProvider) {
    localStorageServiceProvider
      .setPrefix('myApp');
  })
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3';
  });
