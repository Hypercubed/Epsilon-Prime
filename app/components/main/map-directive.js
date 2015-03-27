/* global d3:true */
/* _global _F:true */

(function() {

'use strict';

angular.module('ePrime')
  .directive('gameMap', function($log, ngEcs) {  // todo: use entities
    return {
      restrict: 'AE',
      scope: {
        'item': '=',
        'change': '&'
      },
      link: function link($scope, $element) {

        var bots = ngEcs.systems.bots.$family;
        var chunks = ngEcs.systems.chunks.$family;

        var svgStage = new d3.charts.Grid()
          .on('click', function(d) {
            if (!d.bot) { return; }  // not a bot

            $scope.$apply(function() {
              $scope.change()(d);
            });

          });

        function draw() {
          svgStage.drawChunks(chunks);
          svgStage.drawBots(bots, ngEcs.$delay);
        }

        function update() {
          //$log.debug('update svg');
          svgStage.updateChunks(chunks);
          svgStage.updateBots(ngEcs.$delay);
        }

        $scope.$watch('item', function(d) {
          if (!d || !d.bot) { return; }
          svgStage.zoomTo(d.bot.x, d.bot.y);
          svgStage.updateBots(ngEcs.$delay);
        });

        ngEcs.$s('render', {  // todo: set priority
          $addEntity: draw,
          $update: update
        });

        d3.select($element[0]).datum([chunks,bots]).call(svgStage);

      }
    };
  });

})();
