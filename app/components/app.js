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
    'angularMoment',
    'xeditable',
    'cfp.hotkeys',
    'LocalForageModule'
  ])
  .constant('debug', true)
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'components/main/main.html',
        controller: 'MainCtrl as main',
        resolve: {
          savedGame: function(GAME) {
            //console.log('resolve');
            return GAME.load();
          }
        }
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(function($logProvider, debug){
    $logProvider.debugEnabled(debug);
  })
  .config(function ($localForageProvider) {
    $localForageProvider.config({
      name : 'eprime'
    });
  })
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3';
  });
