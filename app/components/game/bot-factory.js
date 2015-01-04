'use strict';

angular.module('myApp')
  .value('isAt', function isAt(obj,x,y) {
    if (angular.isObject(x)) {
      return x.x === obj.x && x.y === obj.y;
    }
    return x === obj.x && y === obj.y;
  })
  .factory('Bot', function (isAt, TILES) {

    function Bot(name,world,x,y) {  // TODO: move speed, mine speed, storage cap, energy cap, carge rate
      this.name = name;
      this.world = world;

      this.t = TILES.BOT;

      this.x = x;
      this.y = y;
      this.dEdX = 1;

      this.S = 0;      // Raw material storage
      this.mS = 10;    // Maximum
      this.dS = 1;     // Mining ability

      this.E = 0;     // Energy
      this.dE = 0.01;    // Charging rate
      this.mE = 10;   // Maximum

      this.manual = true;
      this.code = '';
      this.fn = null;

      this.message = '';
    }

    Bot.prototype.charge = function(dE) {
      if (arguments.length < 1) {
        dE = this.dE;
      }
      var e = this.E;
      this.E = +Math.min(e + dE, this.mE).toFixed(2);
      return this.E - e;
    };

    Bot.prototype.isAt = function(x,y) {
      return isAt(this,x,y);
    };

    Bot.prototype.canMove = function(dx,dy) {  // TODO: check range

      dx = Math.sign(dx);
      dy = Math.sign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.dEdX*dr;

      return this.world.canMove(this.x + dx,this.y + dy) && this.E >= dE;
    };

    Bot.prototype.move = function(dx,dy) {  // TODO: check range

      dx = Math.sign(dx);
      dy = Math.sign(dy);  // max +/-1

      var dr = Math.max(Math.abs(dx),Math.abs(dy));
      var dE = this.dEdX*dr;

      if (this.world.canMove(this.x + dx,this.y + dy)) {  // Need to check bot skills, check path
        if (this.E >= dE) {
          this.x += dx;
          this.y += dy;
          this.E -= dE;

          this.world.scan(this);
          return true;
        }
      }
      return false;
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

    Bot.prototype.moveTo = function(x,y) {

      if (angular.isObject(x)) {  // TODO: Utility
        y = x.y;
        x = x.x;
      }

      var dx = x - this.x;
      var dy = y - this.y;

      return this.move(dx,dy);
    };

    Bot.prototype.canMine = function() {
      if (this.world.get(this).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          return true;
        }
      }
      return false;
    };

    Bot.prototype.mine = function() {
      if (this.world.get(this).t === TILES.MINE) {  // use world.canMine?
        if (this.E >= 1 && this.S < this.mS) {
          this.E--;
          var dS = this.world.dig(this);  // TODO: bot effeciency
          return this.load(dS);
        }
      }
      return 0;
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

    Bot.prototype.setCode = function(code) {
      this.code = code || this.code;
      this.fn = new Function('$bot', '$home', '$ctrl', this.code);  //this, $bot, $home, $ctrl
    };

    Bot.prototype.run = function() {
      this.setCode(this.code);
      this.manual = false;
    };

    Bot.prototype.stop = function() {
      this.manual = true;
    };

    Bot.prototype.error = function(msg) {
      this.message = msg;
      this.manual = true;
    };

    Bot.prototype.takeTurn = function(dT, main) {
      this.charge(this.dE*dT);

      if(!this.manual && this.fn) {
        try {
          this.fn.call(this,this,main.home,main);  //this, $bot, $home, $ctrl
        } catch(err) {
          var m = err.stack;
          console.log('User script error', m);
          m = m.match(/<anonymous>:[0-9]+:[0-9]+/)[0].replace('<anonymous>:','');  // TODO: fix line number
          this.error(err.message+', '+m);
        }
      }

    };

    Bot.prototype.chargeBot = function(bot) {
      if (isAt(bot, this)) { // TODO: charging range?
        var e = Math.min(10, this.E);  // TODO: charging speed
        e = bot.charge(e);
        this.E -= e;
      } else {
        bot.error('Out of range.');
      }
    };

    Bot.prototype.unloadTo = function(bot) {
      if (isAt(bot, this)) {// TODO: unloading range?
        var s = this.unload();
        var l = bot.load(s);
        this.load(s-l);
        return l;
      }
      return 0;
    };

    Bot.prototype.scan = function() {  // dE cost?
      return this.world.scan(this);
    };

    return Bot;
  });
