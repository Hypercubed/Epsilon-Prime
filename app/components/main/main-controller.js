'use strict';

/**
 * @ngdoc function
 * @name myApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the myApp
 */

var TILE = {
  MOUNTAIN: '▲',
  FIELD: '.',
  MINE: 'X',
  HILL: ',',
  BOT: 'A',
  BASE: '@',
  HOLE: 'O'
};

function Bot(x,y) {  // TODO: move speed, mine speed, storage cap, energy cap, carge rate
  this.x = x;
  this.y = y;

  this.S = 0;     // Raw material storage
  this.mS = 10;    // Maximum

  this.E = 0;     // Energy
  this.dE = 0;    // Charging rate
  this.mE = 10;   // Maximum

}

Bot.prototype.charge = function(dE) {
  if (arguments.length < 1) {
    dE = this.dE;
  }
  var e = this.E;
  this.E = Math.min(e + dE, this.mE);
  return this.E - e;
}

Bot.prototype.move = function(x,y) {
  if (this.E >= 1) {
    this.x += x;
    this.y += y;
    this.E--;
    return true;
  }
  return false;
}

Bot.prototype.mine = function(x,y) {
  if (this.E >= 1 && this.S < this.mS) {
    this.E--;
    return true;
  }
  return false;
}

Bot.prototype.load = function(dS) {
  var s = this.S;
  this.S = Math.min(s + dS, this.mS);
  return this.S - s;
}

Bot.prototype.unload = function() {
  var l = this.S;
  this.S = 0;
  return l;
}

function World() {
  this.map = [];
  this.size = [60,20];
}

World.prototype.generate = function() {
  //console.log('generate');
  this.map = [];

  var p = TILE.FIELD;
  for(var i = 0; i < this.size[0]; i++) {
    var row = [];
    for(var j = 0; j < this.size[1]; j++) {
      var r = Math.random();
      var x = 0.01;
      if (p === TILE.MOUNTAIN) {
        x += 0.3;
      }
      if (i > 0 && j > 0 && this.map[i-1][j-1] === TILE.MOUNTAIN) {
        x += 0.3;
      }
      if (i > 0 && this.map[i-1][j] === TILE.MOUNTAIN) {
        x += 0.3;
      }
      if (r < x) {
        p = TILE.MOUNTAIN;
      } else if (r > 0.98) {
        p = TILE.MINE;
      } else {
        p = TILE.FIELD;
      }
      row.push(p);
    }
    this.map.push(row);
  }

  this.scanned = [];
  for(var i = 0; i < this.size[0]; i++) {
    var row = [];
    for(var j = 0; j < this.size[1]; j++) {
      row.push('&nbsp;');
    }
    this.scanned.push(row);
  }

  return this;
}

World.prototype.scan = function(x,y,R) {
  if (arguments.length < 3) {
    R = y;
    y = x.y;
    x = x.x;
  }
  R = R || 1;
  var r = [];
  for(var i = x-R; i <= x+R; i++) {
    for(var j = y-R; j <= y+R; j++) {
      var t = this.get(i,j);
      if (t !== null) {
        r.push({x: i-x, y: j-y, t: t});
        this.scanned[i][j] = t;
      }
    }
  }
  return r;
}

World.prototype.get = function(x,y) {
  if (arguments.length === 1) {
    y = x.y;
    x = x.x;
  }
  if (x < 0 || x >= this.size[0]) { return null; }
  if (y < 0 || y >= this.size[1]) { return null; }
  return this.map[x][y];
}

World.prototype.dig = function(x,y) {
  if (this.canMine(x,y)) {
    this.map[x][y] = TILE.HOLE;

    var dS = 1;
    if (Math.random() > 0.75) {
      dS++;
    }
    if (Math.random() > 0.99) {
      dS++;
    }
    return dS;
  };
  return 0;
}

World.prototype.canMine = function(x,y) {
  return this.map[x][y] === TILE.MINE;
}

World.prototype.canMove = function(x,y) {
  var t = this.get(x,y);
  return t !== null && t !== TILE.MOUNTAIN;
}

angular.module('myApp')
  .controller('MainCtrl', function ($scope, $interval) {
    var vm = this;

function test() {
var r = this.get(0,0);
if (r === '@') {
  this.chargeBot();
  this.unloadBot();
}
if (r === 'X') {
  this.mine();
}
r = this.scan();
for(var i = 0; i < r.length; i++) {
  var p = r[i];
  if (p.t === 'X') {
    this.move(p.x,p.y);
    return;
  }
};
var x = Math.random()*3-1;
var y = Math.random()*3-1;
this.move(x,y);
}

    var entire = test.toString();
    vm.code = entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}"));

    vm.grid = [];

    vm.world = new World().generate();

    vm.home = new Bot(30, 10);
    vm.home.E = 0;
    vm.home.dE = 0.1;
    vm.home.mE = 10;
    vm.home.mS = 10;

    vm.bot = new Bot(vm.home.x, vm.home.y);
    vm.world.scan(vm.home);

    function isAt(obj,x,y) {
      if (angular.isObject(x)) {
        return x.x === obj.x && x.y === obj.y;
      }
      return x === obj.x && y === obj.y;
    }

    function getTile(x,y) {
      if (vm.world.get(x,y) !== null) {
        if (isAt(vm.home,x,y)) { return '<strong class="text-primary">'+TILE.BASE+'</strong>'; }
        if (isAt(vm.bot,x,y)) { return '<strong class="text-danger">'+TILE.BOT+'</strong>'; }
        return vm.world.scanned[x][y];
      }
    }

    vm.draw = function() {
      var b = '';

      for(var i = 0; i < 20; i++) {
        for(var j = 0; j < 60; j++) {
          b += getTile(j,i);
        }
        b += '\n';
      }

      return b;
    }

    vm.relocate = function() {
      if (vm.home.E >= 1000) {
        vm.home.E -= 1000;
        vm.world.generate();
        vm.world.scan(vm.home);
      }
    }

    vm.upgradeHome = function() {
      if (vm.home.S >= 10) {
        vm.home.S -= 20;
        vm.home.dE += 0.5;
        vm.home.mS += 5;
      }
    }

    vm.upgradeBot = function() {
      if (vm.home.S >= 10) {
        vm.home.S -= 10;
        vm.bot.dE += 0.1;
        vm.bot.mS += 1;
      }
    }

    vm.isHome = function() {
      return isAt(vm.bot, vm.home);
    }

    vm.canMine = function() {
      return !vm.isHome() && vm.world.get(vm.bot.x,vm.bot.y) === TILE.MINE;
    }

    vm.chargeBot = function () {
      if (isAt(vm.bot, vm.home)) {
        var e = Math.min(10, vm.home.E);
        var e = vm.bot.charge(e);
        vm.home.E -= e;
      }
    }

    vm.move = function(x,y) {
      x = Math.floor(x);
      y = Math.floor(y);
      if (vm.world.canMove(vm.bot.x + x,vm.bot.y + y)) {
        vm.bot.move(x,y);
        vm.world.scan(vm.bot);
      }
    }

    vm.mine = function() {
      if (vm.canMine()) {
        if (vm.bot.mine()) {
          var dS = vm.world.dig(vm.bot.x, vm.bot.y);
          vm.bot.load(dS);
        }
      }
    }

    vm.unloadBot = function() {
      if (isAt(vm.bot, vm.home)) {
        var s = vm.bot.unload();
        var ds = vm.home.load(s);
        vm.bot.load(s-ds);
      }
    }

    vm.scan = function() {
      return vm.world.scan(vm.bot);
    }

    vm.get = function(x,y) {
      x = x+vm.bot.x;
      y = y+vm.bot.y;
      if (vm.world.get(x,y) !== null) {
        if (isAt(vm.home,x,y)) { return TILE.BASE; }
        return vm.world.scanned[x][y];
      }
    }

    vm.step = function () {
      var fn = new Function(vm.code);
      fn.call(vm);
    }

    vm.running;
    vm.go = function() {
      vm.step();
      vm.running =  $interval(vm.step, 200);
    }

    vm.stop = function() {
      if (angular.isDefined(stop)) {
        $interval.cancel(vm.running);
        vm.running = undefined;
      }
    }

    function charge() {
      vm.home.charge(vm.home.dE*dT);
      vm.bot.charge(vm.bot.dE*dT);
    }

    vm.keypress = function($event) {
      switch($event.keyCode) {
        case 113:
          vm.move(-1,-1);
          break;
        case 119:
          vm.move(0,-1);
          break;
        case 101:
          vm.move(1,-1);
          break;
        case 100:
          vm.move(1,0);
          break;
        case 97:
          vm.move(-1,0);
          break;
        case 122:
          vm.move(-1,1);
          break;
        case 120:
          vm.move(0,1);
          break;
        case 99:
          vm.move(1,1);
          break;
        case 115:
          if (vm.isHome()) {
            vm.unloadBot();
          } else {
            vm.mine();
          }
          break;
      }

    }

    var dT = 10;

    $interval(charge, dT*1000);

  });
