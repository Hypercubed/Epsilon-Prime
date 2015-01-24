/* global ace:true */

'use strict';

/**
 * @ngdoc function
 * @name myApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the myApp
 */

angular.module('myApp')
  .controller('MainCtrl', function ($scope, $log, $route, $window, $timeout, $modal, hotkeys, debug, isAt, TILES, GAME) {

    var main = this;

    /* main.construct = function(home) {
      var bot = home.construct();
      if (bot) {
        GAME.bots.push(bot);  // need to move this somewhere, needed in Bot.prototype.construct
      }
    }; */

    /* main.setBot = function(index) {  // still used?
      //if (arguments.length < 1) {
      //  index = main.index;
      //}
      //main.index = index;
      main.bot = GAME.bots[index];  // todo: rename main.bot -> main.curbot
      //main.code = bot.code;
      //main.manual = bot.manual;
      //main.refresh++;
    }; */

    /* function getTile(x,y) {  // todo: create map directive

      var tile = GAME.world.get(x,y);

      //console.log(tile);

      if (tile !== null) {
        var _class = 'tile';

        if (isAt(main.bot,x,y)) {  // active bot can be obscured by another
          _class += ' active';
        }

        var bots = GAME.bots.filter(function(bot) {
          return isAt(bot,x,y);
        });

        if (bots.length > 0) {
          var bot = bots[0];
          _class += ' bot bot-'+bot.name.toLowerCase();
          var _tip = bots.map(function(bot) {return bot.name;});
          _tip.push([x,y]);
          _tip = _tip.join('<br />');
          return '<strong class="'+_class+'" tooltip-html-unsafe="'+_tip+'">'+bot.t+'</strong>';
        }

        if (tile.t !== TILES.EMPTY) {
          return '<span class="'+_class+'">'+tile.t+'</span>';
        }
        return '&nbsp;';
      }
      return '*';
    } */

    //main.getTile = getTile;

    main.drawWatch = function drawWatch() {  // Creates a fast hash of maps state.  Most tiles don't change. Better to use events?

      //var xs = mapOffset[0], ys = mapOffset[1];
      var s = d3.sum(GAME.world.$$chunks, _F('hash'));
      //var s = GAME.world.getChunk(xs,ys).hash;  // todo: not ?
      //console.log(s);

      /* var xs = mapOffset[0], ys = mapOffset[1];
      var xe = xs+mapDisplaySize[0], ye = ys+mapDisplaySize[1];

      for(var y = ys; y < ye; y++) {  // need to iterate over rows first
        for(var x = xs; x < xe; x++) {
          var tile = main.world.get(x,y);
          if (tile.s && (tile.t === TILES.MINE || tile.t === TILES.HOLE)) {
            s += tile.t;
          }
        }
      } */

      var ke = GAME.bots.length;  // do better
      var ws = GAME.world.size;
      for(var k = 0; k < ke; k++) {
        var bot = GAME.bots[k];
        s += bot.t+ws*bot.x+bot.y+(bot === main.bot ? '!' : '');
      }

      //s+=mapOffset[0]+mapOffset[1];

      return s;
      //return main.world.chunk.hash;
    };

    $scope.$watch(main.drawWatch, d3Draw); // don't do this

    function Grid() {
      var margin = {top: -5, right: -5, bottom: -5, left: -5},
          width = 500 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var _tile = _F('t');
      var _x = _F('x');
      var _y = _F('y');

      var xScale = d3.scale.linear()
        .range([0, width])
        .domain([0,60]);
      var yScale = d3.scale.linear()
        .range([0, height])
        .domain([0,60]);

      var dx = xScale(1), dy = yScale(1);

      var _X = _F('x', xScale),
          _Y = _F('y', yScale);

      var textAttr = {
        "text-anchor": "middle",
        "alignment-baseline": "middle",
        x: 0,
        y: 0
      }

      var container = null;

      function zoomed() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      var zoom = d3.behavior.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", zoomed);

      function my(selection) {
        selection.each(function(d, i) {

          var tiles = GAME.world.scanList();  // todo: chunk
          var bots = GAME.bots;

          //d3.select('#grid').select('svg').remove();

          if (!container) {
            console.log('draw new');

            var svg = d3.select(this)
              .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
                  .call(zoom);

            svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all");

            container = svg.append("g");

            var gTilesLayer = container.append('g').attr('class','tilesLayer');
            var gBotsLayer = container.append('g').attr('class','botsLayer');
          } else {
            var gBotsLayer = container.select('.botsLayer');
            var gTilesLayer = container.select('.tilesLayer');

            gTilesLayer.selectAll('.tile').remove();  // todo: not this
            gBotsLayer.selectAll('.bot').remove();  // todo: not this
          }

          var tiles = gTilesLayer
            .selectAll('.tile').data(tiles).enter()
              .append('g')
                .attr('class', 'tile')
                .attr('transform', function(d) {
                  return 'translate('+[_X(d),_Y(d)]+')';
                })
                .append('text')
                  .attr(textAttr)
                  .text(_tile);

          var gBots = gBotsLayer
            .selectAll('.bot').data(bots).enter()
            .append('g')
              .attr('class', function(d) {
                var _class = 'bot bot-'+d.name.toLowerCase();
                if (d === main.bot) {
                  _class += ' active';
                }
                return _class;
              })
              .attr('transform', function(d) {
                return 'translate('+[_X(d),_Y(d)]+')';
              });

          gBots
              .append('circle')
              .attr({
                r: 1.2*dx,
                cx: 0,
                cy: 0
              });

          gBots
            .append('text')
              .attr(textAttr)
              .text(_tile);

        });
      }

      return my;
    }

    var grid = Grid();

    function d3Draw() {
      $log.debug('d3 draw');

      d3.select('#grid').call(grid);

      return;

    }

    /* $scope.range = function(n) {  // still needed?
      return new Array(n);
    };

    main.draw = function() {  // still needed?
      $log.debug('draw');

      var b = '';

      var xs = mapOffset[0], ys = mapOffset[1];
      var xe = xs+mapDisplaySize[0], ye = ys+mapDisplaySize[1];

      for(var y = ys; y < ye; y++) {  // need to iterate over rows first
        for(var x = xs; x < xe; x++) {
          b += getTile(x,y);
        }
        b += '\n';
      }

      return b;
    };

    main.pan = function(dx,dy) {
      console.log('pan');
      mapOffset[0] += dx;
      mapOffset[1] += dy;
    }

    main.panTo = function(x,y) { // TODO: tbd

    } */

    main.relocate = function(bot) { // TODO: do something with rovers, move to bot class
      if (bot.E >= 1000) {
        bot.E -= 1000;
        main.showEnd();
      }
    };

    main.upgradeBot = function(bot) {  // TODO: delete
      bot.upgrade();
    };

    // TODO: canMove, isHome, isFull

    main.isAtHome = function(bot) {  // TODO: move to bot class?
      bot = bot || main.bot;
      return (bot !== main.home) && isAt(bot, home);
    };

    main.canMine = function() {  // TODO: move to bot class?
      return GAME.world.get(bot.x,bot.y).t === TILES.MINE;
    };

    /* main.chargeBot = function(bot) {
      home.chargeBot(bot);
    };

    main.move = function(dx,dy) {
      bot = bot || main.bot;
      bot.move(dx,dy);
    };

    main.mine = function() {
      bot = bot || main.bot;
      bot.mine();
    };

    main.unloadBot = function(bot) {
      bot = bot || main.bot;
      bot.unloadTo(home);
    };

    main.scan = function() {
      bot = bot || main.bot;
      return bot.scan();
    }; */

    /* main.get = function(dx,dy) {
      dx = Math.sign(dx);  // Scan distance = 1
      dy = Math.sign(dy);

      var x = dx+bot.x;
      var y = dy+bot.y;

      if (isAt(home,x,y)) { return { t: TILES.BASE }; }
      return main.world.get(x,y);

    }; */

    main.toggleBot = function(bot) {
      bot = bot || main.bot;
      if (bot.manual) {
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

    var d = [  // move
      ['q','NW',-1,-1],
      ['w','N' , 0,-1],
      ['e','NE', 1,-1],
      ['a','W' ,-1, 0],
      ['d','E' , 1, 0],
      ['z','SW',-1, 1],
      ['x','S' , 0, 1],
      ['c','SE', 1, 1]
    ]

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

    /* global */
    hotkeys.bindTo($scope)
      .add({
        combo: 'k',
        //description: 'next bot',
        callback: function() {
          var i = GAME.bots.indexOf(main.bot);
          main.bot = GAME.bots[i+1] || main.game.bots[0];
        }
      })
      .add({
        combo: 'j',
        //description: 'prev bot',
        callback: function() {
          var i = GAME.bots.indexOf(main.bot);
          main.bot = GAME.bots[i-1] || GAME.bots[GAME.bots.length-1];
        }
      })
      .add({
        combo: 'esc',
        description: 'Pause game',
        callback: function() {
          pauseDialog('Paused', false);
        }
      });

    /* bot directions */
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

    /* bot actions */
    hotkeys.bindTo($scope)
      .add({
        combo: 'q w e a d z x c',
        description: 'Move bot'
      })
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
      })
      ;

    /* main.keypress = function(bot, $event) {  // TODO: cheat code
      console.log($event.keyCode);
      switch($event.keyCode) {
        case 102:  // cheat
          main.cheat = true;
          GAME.bots.forEach(function(d) {
            d.E = d.mE;
          });
          break;
        case 113:
          bot.move(-1,-1);
          break;
        case 119:
          bot.move(0,-1);
          break;
        case 101:
          bot.move(1,-1);
          break;
        case 100:
          bot.move(1,0);
          break;
        case 97:
          bot.move(-1,0);
          break;
        case 122:
          bot.move(-1,1);
          break;
        case 120:
          bot.move(0,1);
          break;
        case 99:
          bot.move(1,1);
          break;
        case 115:
          main.mineOrUnload(bot);
          break;
      }

    }; */

    function setup() {
      //main.refresh = 1; // still used?
      main.cheat = false;


      //GAME.reset();
      main.game = GAME;

      //main.world = GAME.world;  // delete this

      main.home = GAME.bots[0];  // remove this??
      //main.game.bots = GAME.bots;
      //main.scripts = GAME.scripts;

      main.bot = GAME.bots[1];  // dont do this

      main.pause = true;
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

      return $modal.open({
        templateUrl: 'components/main/end-model.html',
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        controller: 'EndModalInstanceCtrl',
        resolve: {
          data: function() {
            return {
              message: message,
              showReset: showReset
            };
          }
        }
      })
      .result
        .then(reset, function() {
          GAME.save();
          main.play(_dT);
        });
    }

    main.reset = function() {
      pauseDialog('Are you sure?', true);
    };

    main.showEnd = function() {
      pauseDialog('Congratulations', true);
    };

    main.save = function() {
      GAME.save();
      pauseDialog('Game saved.', false);
    };

    main.showScripts = function() {
      var _dT = main.dT;
      main.play(0);

      function done() {
        GAME.save();
        main.play(_dT);
      }

      $modal.open({
        templateUrl: 'components/editor/editor.html',
        size: 'lg',
        controller: 'EditorCtrl as editor'
      }).result.then(done,done);
    }

    setup();

    d3Draw();

    var mapDisplaySize = [GAME.world.size,GAME.world.size]; // not used anymore?
    var mapOffset = [0,0];  // TODO: focus on

    main.dT = 0;   // move all this to GAME service?

    var timer = undefined;

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
    }

    main.play = function(_dT) {
      clearTimer();
      main.dT = _dT;
      if (_dT > 0) {
        main.takeTurn();
      }
    }

    $scope.$on("$destroy", function( event ) {
      console.log('destroy');
      clearTimer();
    });

  })

  .controller('EndModalInstanceCtrl', function ($scope, data, GAME) {

    $scope.game = GAME;
    $scope.message = data.message;
    $scope.showReset = data.showReset;

  })

  // todo: combine bindHtmlCompile and kcdRecompile
  .directive('bindHtmlCompile', function ($sce, $parse, $compile) {  //https://github.com/incuna/angular-bind-html-compile/blob/master/angular-bind-html-compile.js
    return {
      restrict: 'A',
      compile: function (tElement, tAttrs) {
        var ngBindHtmlGetter = $parse(tAttrs.bindHtmlCompile);
        var ngBindHtmlWatch = $parse(tAttrs.bindHtmlCompile, function getStringValue(value) {
          return (value || '').toString();
        });
        $compile.$$addBindingClass(tElement);

        return function ngBindHtmlLink(scope, element, attr) {
          $compile.$$addBindingInfo(element, attr.ngBindHtml);

          scope.$watch(ngBindHtmlWatch, function ngBindHtmlWatchAction() {
            element.html(ngBindHtmlGetter(scope) || '');
            $compile(element.contents())(scope);
          });
        };
      }
    };
  })

  .directive('botPanel', function ($parse) {  //https://github.com/incuna/angular-bind-html-compile/blob/master/angular-bind-html-compile.js
    return {
      restrict: 'A',
      scope: true,
      templateUrl: 'components/main/bot-panel.html',
      //require: '^main',
      compile: function(tElem, tAttrs) {
        var getter = $parse(tAttrs.botPanel);
        return function link(scope, element, attrs) {
          scope.bot = scope.$parent.$eval(tAttrs.botPanel);
          scope.showControls = angular.isDefined(attrs.showControls) && scope.$parent.$eval(tAttrs.showControls);

          scope.$parent.$watch(tAttrs.botPanel, function(val) {
            scope.bot = val;
          });
        }
      }
    };
  })

  /* .directive('bindHtmlCompile', function ($compile) {  //https://github.com/incuna/angular-bind-html-compile/blob/master/angular-bind-html-compile.js
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.$watch(function () {
          return scope.$eval(attrs.bindHtmlCompile);
        }, function (value) {
          element.html(value);
          $compile(element.contents())(scope);
        });
      }
    };
  }) */

  .directive('kcdRecompile', function($compile, $parse) {

    function removeChildrenWatchers(element) {
      angular.forEach(element.children(), function(childElement) {
        removeAllWatchers(angular.element(childElement));
      });
    }

    function removeAllWatchers(element) {
      if (element.data().hasOwnProperty('$scope')) {
        element.data().$scope.$$watchers = [];
      }
      removeChildrenWatchers(element);
    }

    return {
      scope: true, // required to be able to clear watchers safely
      compile: function(el) {
        var template = el.html();
        return function link(scope, $el, attrs) {
          scope.$parent.$watch(attrs.kcdRecompile, function(_new, _old) {
            var useBoolean = attrs.hasOwnProperty('useBoolean');
            if ((useBoolean && (!_new || _new === 'false')) || (!useBoolean && (!_new || _new === _old))) {
              return;
            }
            // remove all watchers because the recompiled version will set them up again.
            removeChildrenWatchers($el);
            // reset kcdRecompile to false if we're using a boolean
            if (useBoolean) {
              $parse(attrs.kcdRecompile).assign(scope.$parent, false);
            }

            // recompile
            var newEl = $compile(template)(scope.$parent.$new());
            $el.html(newEl);
          });
        };
      }
    };

  });
