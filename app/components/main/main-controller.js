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
  .controller('MainCtrl', function ($scope, $log, $interval, isAt, TILES, GAME) {

    var main = this;

    main.construct = function(home) {
      var bot = home.construct();
      if (bot) {
        main.bots.push(bot);  // need to move this somewhere, needed in Bot.prototype.construct
      }
    };

    main.setBot = function(index) {
      if (arguments.length < 1) {
        index = main.index;
      }
      main.index = index;
      bot = main.bot = main.bots[index];  // todo: rename main.bot -> main.curbot
      main.code = bot.code;
      main.manual = bot.manual;
      main.refresh++;
    };

    function getTile(x,y) {  // todo: create map directive

      var tile = main.world.get(x,y);

      if (tile !== null) {
        var _class = 'tile';

        if (isAt(main.bot,x,y)) {  // active bot can be obscured by another
          _class += ' active';
        }

        var bots = main.bots.filter(function(bot) {
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

        if (tile.s) {
          return '<span class="'+_class+'">'+tile.t+'</span>';
        }
        return '&nbsp;';
      }
      return '*';
    }

    main.drawWatch = function drawWatch() {  // Creates a fast hash of maps state.  Most tiles don't change. Better to use events?
      var s = '';

      var xs = mapOffset[0], ys = mapOffset[1];
      var xe = xs+mapDisplaySize[0], ye = ys+mapDisplaySize[1];

      for(var y = ys; y < ye; y++) {  // need to iterate over rows first
        for(var x = xs; x < xe; x++) {
          var tile = main.world.get(x,y);
          if (tile.s && (tile.t === TILES.MINE || tile.t === TILES.HOLE)) {
            s += tile.t;
          }
        }
      }

      var ke = main.bots.length;
      var ws = main.world.size[0];
      for(var k = 0; k < ke; k++) {
        var bot = main.bots[k];
        s += bot.t+ws*bot.x+bot.y+(bot === main.bot ? '!' : '');
      }

      return s;
    };

    main.draw = function() {  // todo: create map directive
      //$log.debug('draw');

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

    main.relocate = function(bot) { // TODO: do something with rovers, move to bot class
      if (bot.E >= 1000) {
        bot.E -= 1000;
        main.world.generate();
        main.world.scan(home);
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
      return main.world.get(bot.x,bot.y).t === TILES.MINE;
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
      if (isAt(bot,home) && bot.S > 0 && home.S < home.mS) {
        return true;
      }
      return false;
    };

    main.canCharge = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,home) && bot.E < bot.mE && home.E > 0) {
        return true;
      }
      return false;
    };

    main.canMineOrUnload = function(bot) {
      bot = bot || main.bot;
      return bot.canMine() || main.canUnload(bot) || main.canCharge(bot);
    };

    main.mineOrUnload = function(bot) {
      bot = bot || main.bot;
      if (isAt(bot,home)) {
        bot.unloadTo(home);
        home.chargeBot(bot);
      } else {
        bot.mine();
      }
    };

    main.keypress = function(bot, $event) {  // TODO: cheat code
      //console.log($event);
      switch($event.keyCode) {
        case 70:  // cheat
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

    };

    // Init

    main.refresh = 1;
    main.cheat = false;

    main.world = GAME.world;

    var home = main.home = GAME.bots[0];
    main.bots = GAME.bots;
    main.scripts = GAME.scripts;

    var bot = GAME.bots[1];
    main.setBot(1);

    var mapDisplaySize = GAME.world.size; // to map directive
    var mapOffset = [0,0];  // TODO: focus on

    var dT = 1;

    main.tick = 0;

    function mezclar2(arr) {
      for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp) {}
      return arr;
    }

    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex ;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    $interval(function tick() {  // todo: move to GAME?
      mezclar2(GAME.bots.slice(0)).forEach(function(_bot) {
        _bot.takeTurn(dT, GAME);
      });
      main.tick++;
    }, dT*200); // todo: make variable speed

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
