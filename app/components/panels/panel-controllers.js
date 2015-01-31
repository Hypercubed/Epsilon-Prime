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
        };
      }
    };
  });

})();
