(function() {
  'use strict';

  angular.module('ePrime')
  .directive('botPanel', function () {  //https://github.com/incuna/angular-bind-html-compile/blob/master/angular-bind-html-compile.js
    return {
      restrict: 'A',
      scope: true,
      templateUrl: 'components/panels/bot-panel.html',
      //require: '^main',
      compile: function(tElem, tAttrs) {
        //var getter = $parse(tAttrs.botPanel);
        return function link(scope, element, attrs) {
          scope.bot = scope.$parent.$eval(tAttrs.botPanel);
          scope.showControls = angular.isDefined(attrs.showControls) && scope.$parent.$eval(tAttrs.showControls);

          scope.$parent.$watch(tAttrs.botPanel, function(val) {
            scope.bot = val;
          });

          scope.checkName = function(name) {
            if (name.length < 3) {
              return 'Units name must contain at least three characters';
            }
            return true;
          };

          scope.setScript = function(bot, scriptName) {
            if (scriptName === null) {
              bot.$remove('script');
            }
            bot.$add('script', {scriptName: scriptName, halted: false});
          }

        };
      }
    };
  });

})();
