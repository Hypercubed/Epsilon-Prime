'use strict';

angular.module('thirdParty', [])
  .provider('thirdParty', function($provide) {
    var list = [];

    this.register = function(key) {
      list.push(key);
    };

    this.$get = function($window) {

      function set(key) {
        var factory = $window[key];
        if (factory) {
          $window.thirdParty = $window.thirdParty || {};
          $window.thirdParty[key] = factory;
          try {
            delete $window[key];
          } catch (err) {
            $window[key] = undefined;
          }
          $provide.factory(key, function() {
            return factory;
          });
        }
      }

      list.forEach(set);

      return $window.thirdParty;
    };
  })
  .run(function(thirdParty, $log) {
    $log.debug('thirdParty', thirdParty);
  });

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
    'thirdParty'
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
      name : siteConfig.name+siteConfig.store
    });
  })
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3';
  });
