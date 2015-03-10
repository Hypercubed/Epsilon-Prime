
;(function() {
  'use strict';

angular.module('ePrime')
  .value('isAt', function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  })
  .run(function(ngEcs) {

    function createAccessor(bot) {
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

      $bot.moveTo = function $$moveTo(x,y) {
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
    }

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
        e.$bot = createInterface(e);
        e.bot.update();
      }
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

    function Bot() {

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

    var DIR = [
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

    Bot.prototype.moveTo = function(x,y) {  // this is so bad!!!

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
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
      //var dr = Math.max(Math.abs(dx),Math.abs(dy));  // "distance" to target, not euclidian, Chebyshev distance
      var dr = Math.sqrt(dx*dx+dy*dy);  // distance to target, euclidian

      function rnd(x) {
        x = Math.round(x);
        return x === 0 ? 0 : x/Math.abs(x);
      }

      //console.log([dx,dy]);

      dx = rnd(dx/dr);  // "unit vector", not euclidian
      dy = rnd(dy/dr);

      //console.log([dx,dy]);

      var targetSlope = dy/dx;

      if (!this.target || this.target.x !== x || this.target.y !== y) {  // new target
        //console.log('new target');
        this.target = {x:x, y:y};
        this.heading = {dx:dx, dy:dy};
        this.obs = false;
      }

      var targetHeading;
      DIR.forEach(function(d, i) {  // find ordinal direction (0-7), improve
        if (d[0] === dx && d[1] === dy) {
          targetHeading = i;
        }
      });

      //if (this.obs) {
        //console.log('Slope',this.targetSlope, targetSlope, this.targetSlope >= targetSlope);
        //console.log('Distance',this.dr, dr, dr < this.dr);
      //  console.log('Ordinal heading',this.targetHeading, targetHeading);
      //}

      if (this.obs && this.targetSlope === targetSlope && dr <= this.dr) {  // if obs and closer than collision point
        //console.log('At leaving point slopes =',this.targetSlope, targetSlope);
        this.obs = false;
      }

      var heading = targetHeading;
      if (!this.obs) {  // not obs, move to target

        this.iHeading = heading;

        if (this.canWalk(dx,dy)) {
          this.moveStep(dx,dy);
          return true;
        }

        this.obs = true;  // new collision
        this.dr = dr;
        this.targetHeading = heading;
        this.targetSlope = targetSlope;
        //console.log('new coll', heading);
      } else {
        heading = modulo(this.iHeading-2,DIR_LEN);  /// start looking right
        //console.log('old coll', heading);
      }

      var i = 0;
      while (i < DIR_LEN) {  // look left
        var d = DIR[heading];

        //console.log(heading,d);

        if (this.canWalk(d[0],d[1])) {
          this.moveStep(d[0],d[1]);
          this.iHeading = heading;
          //console.log('step', heading, d);
          return true;
        }

        heading++;
        heading %= DIR_LEN;
        i++;
      }

      return false;
    };

    Bot.prototype.canMine = function() {
      if (GAME.world.get(this.x,this.y).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          return true;
        }
      }
      return false;
    };

    Bot.prototype.mine = function() {
      if (GAME.world.get(this.x,this.y).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          this.E--;
          var dS = GAME.world.dig(this.x,this.y);  // TODO: bot effeciency
          dS = this.load(dS);
          GAME.stats.S += dS;
          return dS;
        }
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

    //var _name = _F('name');

    /* Bot.prototype.setCode = function(script) {  // remove
      var self = this;

      function findScript(name) {  // todo: move, default?
        var scripts = self.$game.scripts.filter(_name.eq(name));  // todo: find first or change scriots to hash
        return (scripts.length > 0) ? scripts[0] : undefined;
      }

      if (script === null) {
        this.scriptName = null;
        this.$script = null;
        return null;
      }

      if (typeof script === 'string') {
        script = findScript(script);
      }

      if (!script) {
        $log.error('Script not found');
        return;
      }

      //this.scriptName = script.name;
      //this.$script = script;
      this.message = '';
      return script;
    }; */

    //Bot.prototype.run = function() {  // delete?
    //  this.message = '';
    //  this.manual = false;
    //};

    //Bot.prototype.stop = function() {  // delete?
    //  this.manual = true;
    //};

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

    Bot.prototype.scanList = function(_) {  // TODO: move, GAME.scanFrom?, optimize
      var self = this;
      var l = GAME.scanList(_).filter(function(r) {
        return r !== self;
      });

      if (l.length === 0) { return []; }

      l.forEach(function(d) {
        var dx = d.x - self.x;
        var dy = d.y - self.y;
        d.r = Math.max(Math.abs(dx),Math.abs(dy));
      });

      return l.sort( function(a, b) {return a.r - b.r; } );
    };

    ngEcs.$c('bot', Bot);
  });

})();
