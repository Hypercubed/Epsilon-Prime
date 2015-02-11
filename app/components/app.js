'use strict';

angular
  .module('ePrime', [
    'ngAnimate',
    'ngRoute',
    'ngSanitize',
    'ngMessages',
    'ngTouch',
    'debounce',
    'ui.ace',
    'ui.bootstrap',
    'angularMoment',
    'xeditable',
    'cfp.hotkeys',
    'LocalForageModule'
  ])
  //.constant('debug', true)  // todo: make config object
  //.constant('siteConfig', {
  //  debug: true,
  //  name: 'eprime',
  //  version: 0
  //})
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
  .config(function($logProvider, siteConfig){
    $logProvider.debugEnabled(siteConfig.debug);
  })
  .config(function(hotkeysProvider) {
    hotkeysProvider.includeCheatSheet = false;
  })
  .config(function ($localForageProvider, siteConfig) {
    $localForageProvider.config({
      name : siteConfig.name
    });
  })
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3';
  });
