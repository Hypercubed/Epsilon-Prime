/* global _F:true */
/* global d3:true */

(function() {

'use strict';

    function Grid() {  // TODO: move
      var margin = {top: -5, right: -5, bottom: -5, left: -5},
          width = 500 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var _tile = _F('t');
      //var _x = _F('x');
      //var _y = _F('y');

      var xScale = d3.scale.linear()
        .range([0, width])
        .domain([0,60]);
      var yScale = d3.scale.linear()
        .range([0, height])
        .domain([0,60]);

      var dx = xScale(1); //, dy = yScale(1);

      var _X = _F('x', xScale),
          _Y = _F('y', yScale);

      var textAttr = {
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        x: 0,
        y: 0
      };

      var container = null;

      function zoomed() {
        container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
      }

      var zoom = d3.behavior.zoom()
        .scaleExtent([0.5, 10])
        .on('zoom', zoomed);

      function my(selection) {
        selection.each(function(d) {

          var tiles = d[0];  // TODO: not this
          var bots = d[1];

          //d3.select('#grid').select('svg').remove();

          var gBotsLayer, gTilesLayer;

          if (!container) {
            //$log.debug('draw new');

            var svg = d3.select(this)
              .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                  .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')')
                  .call(zoom);

            svg.append('rect')
                .attr('width', width)
                .attr('height', height)
                .style('fill', 'none')
                .style('pointer-events', 'all');

            container = svg.append('g');

            gTilesLayer = container.append('g').attr('class','tilesLayer');
            gBotsLayer = container.append('g').attr('class','botsLayer');
          } else {
            gBotsLayer = container.select('.botsLayer');
            gTilesLayer = container.select('.tilesLayer');

            //gTilesLayer.selectAll('.tile').remove();  // todo: not this
            //gBotsLayer.selectAll('.bot').remove();  // todo: not this
          }

          var tilesWrap = gTilesLayer
            .selectAll('.tile').data(tiles);

          tilesWrap.enter()
              .append('g')
                .attr('class', 'tile')
                .attr('transform', function(d) {
                  return 'translate('+[_X(d),_Y(d)]+')';
                })
                .append('text')
                  .attr(textAttr)
                  .text(_tile);

          tilesWrap
            .attr('transform', function(d) {
              return 'translate('+[_X(d),_Y(d)]+')';
            })
            .select('text')
              .text(_tile);

          var botsWrap = gBotsLayer
            .selectAll('.bot').data(bots);

          var gBotsEnter = botsWrap.enter()
            .append('g')
            .attr('class', function(d) {
              return 'bot bot-'+d.name.toLowerCase();
            });

          gBotsEnter
              .append('circle')
              .attr({
                r: 1.2*dx,
                cx: 0,
                cy: 0
              });

          gBotsEnter
              .append('text')
                .attr(textAttr)
                .text(_tile);

          botsWrap
              .classed('active', function(d) {
                return d.active;
              })
              .attr('transform', function(d) {
                return 'translate('+[_X(d),_Y(d)]+')';
              });

          //gBots
          //  .append('text')
          //    .attr(textAttr)
          //    .text(_tile);

        });
      }

      return my;
    }

/**
 * @ngdoc function
 * @name myApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the myApp
 */

angular.module('myApp')
  .controller('MainCtrl', function ($scope, $log, $route, $window, $timeout, $modal, hotkeys, modals, debug, isAt, TILES, GAME) {

    var main = this;

    main.drawWatch = function drawWatch() {  // Move to GAME? Creates a fast hash of maps state.  Most tiles don't change. Better to use events?

      var s = ''+GAME.world.getHash();

      var ke = GAME.bots.length;  // do better, move to GAME service
      //var ws = GAME.world.size;
      for(var k = 0; k < ke; k++) {
        var bot = GAME.bots[k];
        var index = GAME.world.getIndex(bot);
        s += bot.t+index+(bot === main.bot ? '!' : '');
      }

      return s;
    };

    var grid = new Grid();

    function d3Draw() {
      $log.debug('d3 draw');

      var tiles = GAME.world.scanList();  // todo: chunk
      var bots = GAME.bots;

      d3.select('#grid').datum([tiles,bots]).call(grid);
    }

    $scope.$watch(main.drawWatch, d3Draw); // don't do this

    main.upgradeBot = function(bot) {  // TODO: delete
      bot.upgrade();
    };

    // TODO: canMove, isHome, isFull

    main.isAtHome = function(bot) {  // TODO: move to bot class? used?
      bot = bot || main.bot;
      return (bot !== main.home) && isAt(bot, main.bots[0]);
    };

    main.canMine = function(bot) {  // TODO: move to bot class?  used?
      bot = bot || main.bot;
      return GAME.world.get(bot.x,bot.y).t === TILES.MINE;
    };

    main.toggleBot = function(bot, flag) {
      if (arguments.length < 2) {
        flag = bot.manual;
      }
      bot = bot || main.bot;
      if (flag) {
        bot.run();
      } else {
        bot.stop();
      }
    };

    main.canUnload = function(bot) {
      bot = bot || main.bot;
      return isAt(bot,main.home) && bot.S > 0 && main.home.S < main.home.mS;  // ??
    };

    main.canCharge = function(bot) {
      bot = bot || main.bot;
      return isAt(bot,main.home) && bot.E < bot.mE && main.home.E > 0;
    };

    main.canMineOrUnload = function(bot) {
      bot = bot || main.bot;
      return bot.canMine() || main.canUnload(bot) || main.canCharge(bot);
    };

    main.mineOrUnload = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,main.home)) {
        bot.unloadTo(main.home);
        main.home.chargeBot(bot);
      } else {
        bot.mine();
      }
    };

    /* cheat */
    if (debug) {
      hotkeys.bindTo($scope)
        .add({
          combo: 'f',
          //description: '',
          callback: function() {
            main.cheat = true;
            GAME.bots.forEach(function(d) {
              d.E = d.mE;
            });
          }
        });
    }

    /* _global */
    /* hotkeys.bindTo($scope)  // esc doesn't play nice with modals
      .add({
        combo: 'esc',
        description: 'Pause game',
        callback: function() {
          main.pause();
        }
      }); */

    var d = [  // move somewhere else
      ['q','NW',-1,-1],
      ['w','N' , 0,-1],
      ['e','NE', 1,-1],
      ['a','W' ,-1, 0],
      ['d','E' , 1, 0],
      ['z','SW',-1, 1],
      ['x','S' , 0, 1],
      ['c','SE', 1, 1]
    ];

    /* bot directions */  // move somewhere else
    d.forEach(function(k) {
      hotkeys.bindTo($scope)
        .add({
          combo: k[0],
          //description: '',
          callback: function() {
            main.bot.move(k[2],k[3]);
          }
        });
    });

    /* bot actions */  // move somewhere else
    hotkeys.bindTo($scope)
      //.add({
      //  combo: 'q w e a d z x c',
      //  description: 'Move bot'
      //})
      .add({
        combo: 's',
        description: 'Action (Unload/load/mine)',
        callback: function() {
          main.mineOrUnload(main.bot);
        }
      })
      .add({
        combo: 'r',
        description: 'Manual/auto',
        callback: function() {
          main.bot.manual = !main.bot.manual;
        }
      })
      .add({
        combo: 'j k',
        description: 'Prev/next bot'
      });

    function setup() {
      main.cheat = false;
      main.game = GAME;

      main.home = GAME.bots[0];  // remove this??
      main.bot = GAME.bots[1];  // dont do this
      //main.bot.active = true;
    }

    function reset() {
      clearTimer();
      GAME.clear().then(function() {
        $window.location.reload();
      });
    }

    function pauseDialog(message,showReset) {
      var _dT = main.dT;
      main.play(0);

      //var previousEsc = hotkeys.get('esc');
      //hotkeys.del('esc');

      //console.log(previousEsc);

      modals.pauseConfirm(message,showReset).result
        .then(reset, function() {
          GAME.save();
          main.play(_dT);
          //hotkeys.add(previousEsc);
        });
    }

    main.reset = function() {
      pauseDialog('Are you sure?', true);
    };

    main.relocate = function(bot) { // TODO: do something with rovers, move to bot class
      if (bot.E >= 1000) {
        bot.E -= 1000;
        pauseDialog('Congratulations', true);
      }
    };

    main.save = function() {
      GAME.save().then(function() {
        pauseDialog('Game saved.', false);
      });
    };

    main.pause = function() {
      pauseDialog('', false);
    };

    main.showScripts = function(_) {

      if (typeof _ === 'string') {  //  move to dialog?
        GAME.scripts.forEach(function(d, i) {  // improve this
          if (d.name === _) {
            _ = i;
          }
        });
      }

      var _dT = main.dT;
      main.play(0);

      function done() {
        GAME.save();
        main.play(_dT);
      }
      
      $modal.open({
        templateUrl: 'components/editor/editor.html',
        size: 'lg',
        backdrop: 'static',
        controller: 'EditorCtrl as editor',
        resolve: {
          initialScriptId: function() { return _; }
        }
      }).result.then(done,done);
    };

    setup();

    d3Draw();

    //var mapDisplaySize = [GAME.world.size,GAME.world.size]; // not used anymore?
    //var mapOffset = [0,0];  // TODO: focus on

    main.dT = 0;   // move all this to GAME service?

    var timer;

    function clearTimer() {
      if (angular.isDefined(timer)) {
        $timeout.cancel( timer );
      }
    }

    main.takeTurn = function() {
      clearTimer();
      GAME.takeTurn();
      if (main.dT > 0) {
        timer = $timeout(main.takeTurn, main.dT);
      }
    };

    main.play = function(_dT) {
      clearTimer();
      main.dT = _dT;
      if (_dT > 0) {
        main.takeTurn();
      }
    };

    $scope.$on('$destroy', function() {
      console.log('destroy');
      clearTimer();
    });

  });

})();
