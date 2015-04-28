/* global d3:true */
/* _global _F:true */

(function() {

'use strict';

angular.module('ePrime')
  .directive('gameMap', function($log, $families, ngEcs, ACTIONS) {  // todo: use entities
    return {
      restrict: 'AE',
      scope: {
        'item': '=',
        'change': '&'
      },
      link: function link(scope, element) {

        var bots = $families.bot;
        var chunks = $families.chunk;

        var svgStage = new d3.charts.Grid()
          .on('click', function(d) {
            if (d.bot) {   // not a bot
              scope.$apply(function() {
                scope.change()(d);
              });
            } else if (d3.event.shiftKey) {
              scope.item.action.clear();
              scope.item.action.push(ACTIONS.moveTo(d.x,d.y));
            }
          });

        function draw() {
          svgStage.drawChunks(chunks);
          svgStage.drawBots(bots);
        }

        function update() {
          svgStage.updateChunks(chunks);
          svgStage.updateBots();
        }

        scope.$watch('item', function(d) {  // don't use watch
          if (!d || !d.bot) { return; }
          svgStage.zoomTo(d.position.x, d.position.y);
          svgStage.updateBots();
        });

        ngEcs.$s('render', {
          $require: ['position'],
          $addEntity: draw,
          $render: update
        });

        d3.select(element[0]).datum([chunks,bots]).call(svgStage);

      }
    };
  });

})();
