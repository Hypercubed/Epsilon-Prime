

;(function() {
  'use strict';

  function distance(a,b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.max(Math.abs(dx),Math.abs(dy));
  }

  var mathSign = Math.sign || function (value) {  // polyfill for Math.sign
    var number = +value;
    if (number === 0) { return number; }
    if (Number.isNaN(number)) { return number; }
    return number < 0 ? -1 : 1;
  };

  /* function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  } */

  function modulo(x,n) {  // move somewher globally usefull
    return ((x%n)+n)%n;
  }

  function rnd(x) {
    x = Math.round(x);
    return x === 0 ? 0 : x/Math.abs(x);
  }

angular.module('ePrime')
  //.value('isAt', isAt)
  .factory('Position', function(ngEcs) {

    function Position() {
      this.x = 0;
      this.y = 0;
    }

    Position.prototype.isAt = function(x,y) {
      if (angular.isObject(x)) {
        return x.x === this.x && x.y === this.y;
      }
      return x === this.x && y === this.y;
    };

    Position.prototype.distanceTo = function(x,y) {
      if (angular.isObject(x)) {
        y = x.y;
        x = x.x;
      }
      var dx = x - this.x;
      var dy = y - this.y;
      return Math.max(Math.abs(dx),Math.abs(dy));
    };

    ngEcs.$c('position', Position);

    return Position;

  })
  .run(function(ngEcs) {

    //function find(bot, _) {  // used by unload and charge, move?
    //  return bot.findNearest(_);
    //}

    function Copy(e) {
      var self = this;

      ['name','S','mS','E','mE'].forEach(function(prop) {
        self[prop] = e.bot[prop];
      });

      ['x','y'].forEach(function(prop) {
        self[prop] = e.position[prop];
      });

    }

    function Accessor(e) {
      var self = this;

      ['name','S','mS','E','mE','mem'].forEach(function(prop) {
        Object.defineProperty(self, prop, {
          get: function() {return e.bot[prop]; }
        });
      });

      ['x','y'].forEach(function(prop) {
        Object.defineProperty(self, prop, {
          get: function() {return e.position[prop]; }
        });
      });

    }

    function BotProxy(e) {

      Accessor.call(this, e);

      this.moveTo = e.bot.moveTo.bind(e.bot);
      this.move = e.bot.move.bind(e.bot);
      this.mine = e.bot.mine.bind(e.bot);
      this.upgrade = e.bot.upgrade.bind(e.bot);


      this.unload = BotProxy.prototype.unload.bind(e.bot);
      this.charge = BotProxy.prototype.charge.bind(e.bot);
      this.construct = BotProxy.prototype.construct.bind(e.bot);
      this.find = BotProxy.prototype.find.bind(e.bot);
      this.distanceTo = BotProxy.prototype.distanceTo.bind(e);
      this.log = BotProxy.prototype.log.bind(e.bot);
    }

    BotProxy.prototype.unload = function(_) {  // should unload to co-located @
      var home = this.findAt(_ || '@');  // todo: just check bot entities
      return (home) ? this.unloadTo(home) : null;
    };

    BotProxy.prototype.charge = function(_) {  // should charge to co-located @
      var home = this.findAt(_ || '@'); // todo: just check bot entities
      return (home) ? home.bot.chargeBot(this.$parent) : null;
    };

    BotProxy.prototype.construct = function(_) {
      this.construct(_ || null);
    };

    //console.log($bot.distanceTo($bot.find('O')))
    BotProxy.prototype.distanceTo = function(_) {
      if (typeof _ === 'string') {
        _ = this.bot.findNearest(_);
        return this.position.distanceTo(_);
      }
      var args = Array.prototype.slice.call(arguments);
      return this.position.distanceTo.apply(this, args);
    };

    BotProxy.prototype.find = function(_) {
      var n = this.findNearest(_);
      if (!n) { return null; }
      if (n.$bot) {
        n = new Copy(n);
      }
      return n;
    };

    BotProxy.prototype.log = function(msg) {
      this.addAlert('success', msg);
    };

    /* function createAccessor(bot) {
      var $bot = {};

      ['name','x','y','S','mS','E','mE'].forEach(function(prop) {
        Object.defineProperty($bot, prop, {
          get: function() {return bot[prop]; }
        });
      });

      return $bot;

    }

    function createInterface(e) {
      var bot = e.bot;
      var $bot = createAccessor(bot);

      $bot.move = function $$move(x,y) {
        return bot.move(x,y);
      };

      $bot.moveTo = function $$moveTo(x,y) {  // this is not good
        //if (bot.obs) {
        //  return bot.moveTo(bot.target.x,bot.target.y);
        //}
        return bot.moveTo(x,y);
      };

      $bot.mine = function $$mine() {
        return bot.mine();
      };

      $bot.unload = function $$unload(_) {  // should unload to co-located @
        var home = find(_ || '@');  // gets closest
        return (home) ? bot.unloadTo(home) : null;
      };

      $bot.charge = function $$charge(_) {  // should charge to co-located @
        var home = find(_ || '@');  // gets closest
        return (home) ? home.bot.chargeBot(e) : null;
      };

      $bot.upgrade = function $$upgrade() {
        bot.upgrade();
      };

      $bot.construct = function $$construct(_) {
        bot.construct(_ || null);
      };

      function find(_) {  // used by unload and charge, move?
        var r = bot.scanList(_);
        return (r.length > 0) ? r[0] : null;
      }

      $bot.find = function $$find(_) {  // move?
        var r = find(_);
        return (r && r.$bot) ? createAccessor(r.bot) : r;  // maybe should just be properties
      };

      $bot.log = function(msg) {
        bot.addAlert('success', msg);
      };

      return $bot;
    } */

    ngEcs.$s('charging', {  // todo: create charging component, move
      factor: 1,
      actionFactor: 1,
      $require: ['bot'],
      $addEntity: function(e) {  // should be part of scripting?
        e.$bot = new BotProxy(e);  // should be a component?
        e.bot.update();
      },
      $updateEach: function(e,dt) {
        //console.log(bot);
        //var i = -1,arr = this.$family,len = arr.length,bot,dE;
        //while (++i < len) {
          var bot = e.bot;
          var dE = +Math.min(bot.chargeRate*dt*this.factor, bot.mE-bot.E);
          bot.E += dE;
          ngEcs.stats.E += dE;
        //}
      }
    });

    //var e = this.E;
    //this.E = +Math.min(e + dE, this.mE).toFixed(4);
    //return this.E - e;

    /* ngEcs.$s('botsRender', {
      $require: ['bot','render'],
      $addEntity: function(e) {
        if (svgStage.renderBots) {
          var bots = this.$family;
          svgStage.renderBots(bots);
        }
      },
      $update: function() {
        this.$family.forEach(function(e) {
          if (e.$render) {
            e.$render();
          }
        });
      }
    }); */

  })
  .run(function(ngEcs) {
    function ActionComponent() {
      this.queue = [];
    }

    ActionComponent.prototype.push = function(fn) {
      this.queue.push(fn);
    };

    ActionComponent.prototype.next = function() {
      return this.queue.shift();
    };

    ActionComponent.prototype.clear = function() {
      this.queue = [];
    };

    ngEcs.$c('action', ActionComponent);

    ngEcs.$s('action', {  // todo: move
      $require: ['bot','action'],
      $updateEach: function(e) {

        if (e.bot.E < 1 || e.action.queue.length < 1) { return; }  // todo: make while

        //if (e.action.queue.length > 0) { // remove action component when done?
          var fn = e.action.next();
          var ret = fn(e);
          if (ret.next) {
            e.action.push(ret.next);
          }
        //}

      }
    });

  })
  .constant('botParams', {
    mS0: 10,  // Starting storage capacity
    mE0: 10,  // Starting energy capacity
    DIS: 2,  // 1+Discharge exponent, faster discharge means lower effeciency
    CHAR: 0.5, // Charging effeciency
    I: 0.5, // moves per turn for starting unit
    E: 2/3,  // surface/volume exponent,
    constructCost: 20,
    maxBots: 10
  })
  .run(function (Position, TILES, GAME, ngEcs, $families, botParams) {  // Bot components

    /* function Tile() {
      this.x = 0;
      this.y = 0;
      this.t = TILES.BOT;
    };

    Tile.prototype.isAt = function(x,y) {
      return isAt(this,x,y);
    }; */

    function Bot(parent) {

      this.name = '';
      this.t = TILES.BOT;
      //this.x = 0;
      //this.y = 0;

      this.S = 0;      // Raw material storage
      this.mS = 10;    // Maximum
      this.dS = 1;     // Mining ability
      this.E = 0;      // Energy
      this.dE = 0.01;  // Charging rate
      this.mE = 10;    // Maximum

      this.active = false;
      this.message = '';
      this.alerts = [];

      this.mem = {};

      this.$parent = parent;

    }

    Bot.prototype.addAlert = function(type, msg) {  // script component
      this.alerts.push({type:type, msg:msg});
    };

    Bot.prototype.closeAlert = function(index) {  // script component
      this.alerts.splice(index, 1);
    };

    Bot.prototype.clearLog = function() {  // script component
      this.alerts.splice(0);
    };

    Bot.prototype.error = function(msg) {  // script component
      console.log('bot error', msg);
      if (this.$parent.script) {
        this.$parent.script.halted = true;
      }
      //this.$parent.script.halted = true;
      //this.message = msg; // used as error flag, get rid of this
      this.addAlert('danger',msg);
      //this.setCode(null);
    };

    Bot.prototype.charge = function(dE) {  // battery component
      var e = this.E;
      this.E = +Math.min(e + dE, this.mE).toFixed(4);
      return this.E - e;
    };

    //Bot.prototype.isAt = Position.prototype.isAt;  // move
    //Bot.prototype.distanceTo = Position.prototype.distanceTo;  // move

    //Bot.prototype.isNotAt = function(x,y) {  // Position component
    //  return this.x !== x || this.y !== y;
    //};

    //Bot.prototype.mass = function() {
    //  return this.mS + this.mE;
    //};

    //var DIS = 1+1;  // 1+Discharge exponent, faster discharge means lower effeciency

    //Bot.prototype.moveCost = function() {
    //  return Math.pow(this.mass/20, DIS);
    //};

    /* var CHAR = 0.5; // Charging effeciency
    var I = 1; // moves per turn for base
    var E = 2/3;  // surface/volume exponent
    var N = CHAR*I/(Math.pow(20, E));  // normilization factor

    Bot.prototype.chargeRate = function() {
      return N*Math.pow(this.mass(), E);
    }; */

    Bot.prototype.canMove = function(dx,dy) {  // TODO: check range  // Movement component
      var position = this.$parent.position;

      dx = mathSign(dx);
      dy = mathSign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost*dr;

      return GAME.world.canMove(position.x + dx,position.y + dy) && this.E >= dE;
    };

    Bot.prototype.move = function(dx,dy) {  // TODO: check range  // Movement component
      var position = this.$parent.position;

      this.obs = false;

      dx = mathSign(dx);
      dy = mathSign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));  // Chebyshev distance
      var dE = this.moveCost*dr;

      if (this.E >= dE && GAME.world.canMove(position.x + dx,position.y + dy)) {  // Need to check bot skills, check path

          this.last = {x: position.x, y: position.y};
          this.heading = {x: dx, y:dy};

          position.x += dx;
          position.y += dy;
          this.E -= dE;

          GAME.world.scanRange(position);

          return true;
      }
      return false;
    };

    Bot.prototype.canWalk = function(dx,dy) {  // Movement component
      var position = this.$parent.position;
      return GAME.world.canMove(position.x+dx,position.y+dy);
    };

    Bot.prototype.moveStep = function(dx,dy) {  // TODO: check range  // Movement component
      var position = this.$parent.position;

      position.x += dx;
      position.y += dy;
      this.E -= this.moveCost;

      GAME.world.scanRange(position);
      return true;
    };

    Bot.prototype.canMoveTo = function(x,y) {  // TODO: check range  // Movement component

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
      }

      var dx = x - this.$parent.position.x;
      var dy = y - this.$parent.position.y;

      return this.canMove(dx,dy);
    };

    var DIR = [  // move
      [1,1],  // 0
      [1,0],  // 1
      [1,-1], // 2
      [0,-1], // 3
      [-1,-1],// 4
      [-1,0], // 5
      [-1,1], // 6
      [0,1],  // 7
    ];

    var DIR_LEN = DIR.length;

    /* DIR.forEach(function(d) {
      var a = modulo(8-Math.round(Math.atan2(d[1], d[0])/0.7853981633974483), 7);
      console.log(d, a);
    }); */



    Bot.prototype.moveTo = function(x,y) {  // this is so bad!!! use action queue  // Movement component

      if (angular.isObject(x)) {  // TODO: Utility
        y = +x.y || 0;
        x = +x.x || 0;
      } else {
        x = +x || 0;
        y = +y || 0;
      }

      var position = this.$parent.position;

      if (position.isAt(x,y)) {
        this.obs = false;
        return true;
      }

      if (this.E < this.moveCost) {
        return false;
      }

      var dx = x - position.x;
      var dy = y - position.y;
      var dr = Math.max(Math.abs(dx),Math.abs(dy));  // "distance" to target, not euclidian, Chebyshev distance
      //var dr = Math.sqrt(dx*dx+dy*dy);  // distance to target, euclidian

      //console.log([dx,dy]);

      dx = rnd(dx/dr);  // "unit vector" towards goal, not euclidian
      dy = rnd(dy/dr);

      if (!this.target || this.target.x !== x || this.target.y !== y) {  // new target
        //console.log('new target');
        this.target = {x:x, y:y};
        var _heading = {dx:dx, dy:dy};
        this.obs = this.obs && angular.equals(this.heading, _heading);
        this.heading = _heading;
      }

      var C = this.canWalk(dx,dy); // is free towards goal

      var targetHeading;
      DIR.forEach(function(d, i) {  // find ordinal direction (0-7), improve
        if (d[0] === dx && d[1] === dy) {
          targetHeading = i;
        }
      });

      var ddx = x - (position.x + dx);
      var ddy = y - (position.y + dy);
      var DF = Math.max(Math.abs(ddx),Math.abs(ddy));  // "distance" to target, not euclidian, Chebyshev distance
      //var DF = Math.sqrt(ddx*ddx+ddy*ddy);  // distance from next step towards goal to goal

      //if (this.$parent.active) { console.log('before', this.obs, C, DF, this.dr); }

      if (this.obs && C && (DF < this.dr)) {  // if obs and closer than collision point, need to check if DF === this.dr and starting point
        this.obs = false;  // not starting point
      }

      this.dr = Math.min(dr, this.dr);            // minimum distance

      //if (this.$parent.active) { console.log('after', this.obs, C, DF, this.dr); }

      var heading;
      if (!this.obs) {  // not obs, move to target

        if (C) {
          this.moveStep(dx,dy);
          return true;
        }

        this.obs = true;  // new collision
        this.dr = dr;
        this.P = [x,y];
        heading = targetHeading;
      } else {
        heading = modulo(this.iHeading-2,DIR_LEN);  /// start looking right
      }

      var i = 0;
      while (i < DIR_LEN) {  // look left
        var d = DIR[heading];

        if (this.canWalk(d[0],d[1])) {
          this.moveStep(d[0],d[1]);
          this.iHeading = heading;                  // keep heading for next step
          return true;
        }

        heading++;                                 // turn legft
        heading %= DIR_LEN;
        i++;
      }

      return false;
    };

    Bot.prototype.canMine = function() {  // mining component
      return this.E >= 1 &&
        this.S < this.mS &&
        GAME.world.get(this.$parent.position.x,this.$parent.position.y).t === TILES.MINE;
    };

    Bot.prototype.mine = function() {  // mining component
      if (this.canMine()) {
        this.E--;
        var dS = GAME.world.dig(this.$parent.position.x,this.$parent.position.y);  // TODO: bot effeciency?
        dS = this.load(dS);
        GAME.stats.S += dS;
        return dS;
      }
      return false;
    };

    Bot.prototype.load = function(dS) {  // storage component
      var s = this.S;
      this.S = Math.min(s + dS, this.mS);
      return this.S - s;
    };

    Bot.prototype.unload = function() {  // storage component
      var l = this.S;
      this.S = 0;
      return l;
    };

    Bot.prototype.chargeBot = function(bot) {  // battery component
      //console.log('charge', bot);
      if (bot.position.isAt(this.$parent.position)) { // TODO: charging range?
        var e = Math.min(10, this.E);  // TODO: charging speed
        e = bot.bot.charge(e);
        this.E -= e;
        return e;
      }
      return false;
    };

    Bot.prototype.unloadTo = function(bot) {  // storage component
      //console.log('unloadTo',bot);
      if (bot.position.isAt(this.$parent.position)) {// TODO: unloading range?
        var s = this.unload();
        var l = bot.bot.load(s);
        this.load(s-l);
        return l;
      }
      return 0;
    };

    Bot.prototype.canUpgrade = function() {
      return this.S >= this.upgradeCost;
    };

    //var DIS = 1+1;  // 1+Discharge exponent, faster discharge means lower effeciency
    //var CHAR = 0.5; // Charging effeciency
    //var I = 1; // moves per turn for rover
    //var E = 2/3;  // surface/volume exponent
    var N = 10*botParams.CHAR*botParams.I/(Math.pow(20, botParams.E));  // normilization factor

    Bot.prototype.upgrade = function() {
      //C = C || this.upgradeCost;
      if (this.S >= this.upgradeCost) {
        this.S -= this.upgradeCost;
        this.mS += 10;
        this.mE += 10;
        this.update();
      }
    };

    Bot.prototype.update = function() {
      this.mass = this.mE + this.mS;
      this.moveCost =  Math.pow(this.mass/20, botParams.DIS);
      this.chargeRate = N*Math.pow(this.mass, botParams.E);
      this.upgradeCost = 0.5*this.mass;
      this.constructCost = botParams.constructCost;

      if (this.mS >= this.constructCost) {
        this.t = TILES.BASE;
      }
    };

    Bot.prototype.canConstruct = function() {  // where used? Move this to component
      return ($families.bot.length < botParams.maxBots) && (this.S >= botParams.constructCost);
    };

    Bot.prototype.construct = function(script) {  // todo: move to construct component

      if (this.canConstruct()) {
        var position = this.$parent.position;

        var bot = GAME.ecs.$e({
          bot: {
            name: 'Rover'
          },
          action: {},
          position: {
            x: position.x,
            y: position.y,
          }
        });

        if (script) {
          bot.$add('script', {
            scriptName: script,
            halted: false
          });
        }

        this.S -= this.constructCost;
        return bot;
      }
      return null;
    };

    Bot.prototype.canRelocate = function() {  // component?
      return this.E >= 200;
    };

    Bot.prototype.scan = function() {  // scanner component, range?
      return GAME.world.scan(this.$parent.position);
    };

    Bot.prototype.findAt = function(_) {  // use directly
      return GAME.findBotAt(_, this.$parent.position.x, this.$parent.position.y);
    };

    Bot.prototype.findNearest = function(_) {  // move, range?
      var self = this;
      var r = 1e10;
      var ret = null;

      var position = self.$parent.position;

      GAME.scanList(_)
        .forEach(function(e) {  // do better
          if (e !== self) {
            var b = e.bot || e;
            var _r = distance(b,position);
            if (_r < r) {
              ret = e;
              r = _r;
            }
          }
        });

      return ret;
    };

    Bot.prototype.scanList = function(_) {  // TODO: move, GAME.scanFrom?, optimize
      var self = this;
      var l = GAME.scanList(_).filter(function(r) {
        return r !== self;
      });

      if (l.length === 0) { return []; }

      var position = self.$parent.position;

      l.forEach(function(d) {
        var b = d.bot || d;
        var dx = b.x - position.x;
        var dy = b.y - position.y;
        d.r = Math.max(Math.abs(dx),Math.abs(dy));  // don't do this, adds r to entities?
      });

      return l.sort( function(a, b) {return a.r - b.r; } );
    };

    ngEcs.$c('bot', Bot);
  });

})();
