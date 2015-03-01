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
    'LocalForageModule',
    'angular-intro',
    'hc.thirdParty',
    'hc.ngEcs'
  ])
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
      name : siteConfig.name+siteConfig.store
    });
  })
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3';
  });
