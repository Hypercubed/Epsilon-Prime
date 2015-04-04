

;(function() {
  'use strict';

  function distance(a,b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.max(Math.abs(dx),Math.abs(dy));
  }

angular.module('ePrime')
  .value('isAt', function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  })
  .run(function(ngEcs) {

    //function find(bot, _) {  // used by unload and charge, move?
    //  return bot.findNearest(_);
    //}

    function Copy(e) {
      var self = this;

      ['name','x','y','S','mS','E','mE'].forEach(function(prop) {
        self[prop] = e[prop];
      });

    }

    function Accessor(e) {
      var self = this;

      ['name','x','y','S','mS','E','mE','mem'].forEach(function(prop) {
        Object.defineProperty(self, prop, {
          get: function() {return e[prop]; }
        });
      });

    }

    function BotProxy(e) {

      Accessor.call(this, e.bot);

      this.moveTo = e.bot.moveTo.bind(e.bot);
      this.move = e.bot.move.bind(e.bot);
      this.mine = e.bot.mine.bind(e.bot);
      this.upgrade = e.bot.upgrade.bind(e.bot);


      this.unload = BotProxy.prototype.unload.bind(e.bot);
      this.charge = BotProxy.prototype.charge.bind(e.bot);
      this.construct = BotProxy.prototype.construct.bind(e.bot);
      this.find = BotProxy.prototype.find.bind(e.bot);
      this.distanceTo = BotProxy.prototype.distanceTo.bind(e.bot);
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

    BotProxy.prototype.distanceTo = function(_) {
      return distance(this,_);
    };

    BotProxy.prototype.find = function(_) {
      var n = this.findNearest(_);
      if (!n) { return null; }
      if (n.$bot) {
        n = new Copy(n.bot);
      }
      return n;
    };

    BotProxy.prototype.log = function(msg) {
      this.bot.addAlert('success', msg);
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

    ngEcs.$s('charging', {
      $require: ['bot'],
      $update: function() {
        this.$family.forEach(function(e) {  // todo: for loop
          var bot = e.bot;
          ngEcs.stats.E += bot.charge(bot.chargeRate);
        });
      }
    });

    ngEcs.$s('bots', {
      $require: ['bot'],
      $addEntity: function(e) {
        e.$bot = new BotProxy(e);
        e.bot.update();
      }//,
      //$update: function() {
      //  this.$family.forEach(function(e) {  // restore interface for safety
      //    e.$bot = new BotProxy(e);
      //  });
      //}
    });


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
  .run(function (isAt, TILES, GAME, ngEcs) {  // Bot components

    var mathSign = Math.sign || function (value) {  // polyfill for Math.sign
      var number = +value;
      if (number === 0) { return number; }
      if (Number.isNaN(number)) { return number; }
      return number < 0 ? -1 : 1;
    };

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
      this.x = 0;
      this.y = 0;

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

    Bot.prototype.addAlert = function(type, msg) {
      this.alerts.push({type:type, msg:msg});
    };

    Bot.prototype.closeAlert = function(index) {
      this.alerts.splice(index, 1);
    };

    Bot.prototype.clearLog = function() {
      this.alerts.splice(0);
    };

    Bot.prototype.error = function(msg) {  // move
      this.$parent.script.halted = true;
      //this.message = msg; // used as error flag, get rid of this
      this.addAlert('danger',msg);
      //this.setCode(null);
    };

    Bot.prototype.charge = function(dE) {
      var e = this.E;
      this.E = +Math.min(e + dE, this.mE).toFixed(4);
      return this.E - e;
    };

    Bot.prototype.isAt = function(x,y) {
      return isAt(this,x,y);
    };

    Bot.prototype.isNotAt = function(x,y) {
      return this.x !== x || this.y !== y;
    };

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

    Bot.prototype.canMove = function(dx,dy) {  // TODO: check range

      dx = mathSign(dx);
      dy = mathSign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.moveCost*dr;

      return GAME.world.canMove(this.x + dx,this.y + dy) && this.E >= dE;
    };

    Bot.prototype.move = function(dx,dy) {  // TODO: check range

      this.obs = false;

      dx = mathSign(dx);
      dy = mathSign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));  // Chebyshev distance
      var dE = this.moveCost*dr;

      if (GAME.world.canMove(this.x + dx,this.y + dy)) {  // Need to check bot skills, check path
        if (this.E >= dE) {
          this.last = {x: this.x, y: this.y};
          this.heading = {x: dx, y:dy};

          this.x += dx;
          this.y += dy;
          this.E -= dE;

          GAME.world.scanRange(this);

          return true;
        }
      }
      return false;
    };

    Bot.prototype.canWalk = function(dx,dy) {
      return GAME.world.canMove(this.x+dx,this.y+dy);
    };

    Bot.prototype.moveStep = function(dx,dy) {  // TODO: check range
        this.x += dx;
        this.y += dy;
        this.E -= this.moveCost;

        GAME.world.scanRange(this);
        return true;
    };

    Bot.prototype.canMoveTo = function(x,y) {  // TODO: check range

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
      }

      var dx = x - this.x;
      var dy = y - this.y;

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

    function modulo(x,n) {  // move somewher globally usefull
      return ((x%n)+n)%n;
    }

    function rnd(x) {
      x = Math.round(x);
      return x === 0 ? 0 : x/Math.abs(x);
    }

    Bot.prototype.moveTo = function(x,y) {  // this is so bad!!!

      if (angular.isObject(x)) {  // TODO: Utility
        y = +x.y || 0;
        x = +x.x || 0;
      } else {
        x = +x || 0;
        y = +y || 0;
      }

      if (isAt(this, x,y)) {
        this.obs = false;
        return true;
      }

      if (this.E < this.moveCost) {
        return false;
      }

      var dx = x - this.x;
      var dy = y - this.y;
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

      var ddx = x - (this.x + dx);
      var ddy = y - (this.y + dy);
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

    Bot.prototype.canMine = function() {
      return this.E >= 1 &&
        this.S < this.mS &&
        GAME.world.get(this.x,this.y).t === TILES.MINE;
    };

    Bot.prototype.mine = function() {
      if (this.canMine()) {
        this.E--;
        var dS = GAME.world.dig(this.x,this.y);  // TODO: bot effeciency?
        dS = this.load(dS);
        GAME.stats.S += dS;
        return dS;
      }
      return false;
    };

    Bot.prototype.load = function(dS) {  // dE?
      var s = this.S;
      this.S = Math.min(s + dS, this.mS);
      return this.S - s;
    };

    Bot.prototype.unload = function() {  // dE?
      var l = this.S;
      this.S = 0;
      return l;
    };

    Bot.prototype.chargeBot = function(bot) {
      //console.log('charge', bot);
      if (isAt(bot.bot, this)) { // TODO: charging range?
        var e = Math.min(10, this.E);  // TODO: charging speed
        e = bot.bot.charge(e);
        this.E -= e;
        return e;
      }
      return false;
    };

    Bot.prototype.unloadTo = function(bot) {
      if (isAt(bot.bot, this)) {// TODO: unloading range?
        var s = this.unload();
        var l = bot.bot.load(s);
        this.load(s-l);
        return l;
      }
      return 0;
    };

    Bot.prototype.canUpgrade = function() {
      return this.S >= 10;
    };

    var DIS = 1+1;  // 1+Discharge exponent, faster discharge means lower effeciency
    var CHAR = 0.5; // Charging effeciency
    var I = 1; // moves per turn for base
    var E = 2/3;  // surface/volume exponent
    var N = CHAR*I/(Math.pow(20, E));  // normilization factor

    Bot.prototype.upgrade = function() {
      if (this.S >= 10) {
        this.S -= 10;
        this.mS += 10;
        this.mE += 10;
        this.update();
      }
    };

    Bot.prototype.update = function() {
      if (this.mS >= 100) {
        this.t = TILES.BASE;
      }
      this.mass = this.mE + this.mS;
      this.moveCost =  Math.pow(this.mass/20, DIS);
      this.chargeRate = N*Math.pow(this.mass, E);
    };

    Bot.prototype.canConstruct = function() {  // where used? Move this to component
      return this.S >= 100;
    };

    Bot.prototype.construct = function(script) {  // todo: move to construct component
      if (this.S >= 100) {
        //var self = this;

        var bot = GAME.ecs.$e({
          bot: {
            name: 'Rover',
            x: this.x,
            y: this.y,
          },
          render: {}
        });

        if (script) {
          bot.$add('script', {
            scriptName: script,
            halted: false
          });
        }

        this.S -= 100;
        return bot;
      }
      return null;
    };

    Bot.prototype.canRelocate = function() {  // component?
      return this.E >= 500;
    };

    Bot.prototype.scan = function() {  // used?
      return GAME.world.scan(this);
    };

    Bot.prototype.findAt = function(_) {  // move
      return GAME.findBotAt(_, this.x, this.y);
    };

    Bot.prototype.findNearest = function(_) {
      var self = this;
      var r = 1e10;
      var ret = null;

      GAME.scanList(_)
        .forEach(function(e) {  // do better
          if (e !== self) {
            var b = e.bot || e;
            var _r = distance(b,self);
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

      l.forEach(function(d) {
        var b = d.bot || d;
        var dx = b.x - self.x;
        var dy = b.y - self.y;
        d.r = Math.max(Math.abs(dx),Math.abs(dy));  // don't do this, adds r to entities?
      });

      return l.sort( function(a, b) {return a.r - b.r; } );
    };

    ngEcs.$c('bot', Bot);
  });

})();
