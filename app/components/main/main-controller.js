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

function isAt(obj,x,y) {
  if (angular.isObject(x)) {
    return x.x === obj.x && x.y === obj.y;
  }
  return x === obj.x && y === obj.y;
}

function Bot(name,world,x,y) {  // TODO: move speed, mine speed, storage cap, energy cap, carge rate
  this.name = name;
  this.world = world;

  this.t = TILE.BOT;

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

Bot.prototype.move = function(dx,dy) {  // TODO: check range

  dx = Math.sign(dx);
  dy = Math.sign(dy);

  if (this.world.canMove(this.x + dx,this.y + dy)) {  // Need to check bot skills, check path
    if (this.E >= this.dEdX) {
      this.x += dx;
      this.y += dy;
      this.E -= this.dEdX;

      this.world.scan(this);
      return true;
    }
  }
  return false;
};

Bot.prototype.moveTo = function(x,y) {

  if (angular.isObject(x)) {  // TODO: Utility
    y = x.y;
    x = x.x;
  }

  var dx = x - this.x;
  var dy = y - this.y;

  this.move(dx,dy);
};

Bot.prototype.mine = function() {
  if (this.world.get(this).t === TILE.MINE) {  // use world.canMine?
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

Bot.prototype.run = function() {
  this.fn = new Function('$bot', '$home', '$ctrl', this.code);  //this, $bot, $home, $ctrl
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

function World() {
  this.map = [];
  this.size = [60,20];  // cols, rows
}

World.prototype.generate = function() {
  //console.log('generate');
  this.map = [];

  var i, j, col;

  for(i = 0; i < this.size[0]; i++) {  // col
    col = [];
    for(j = 0; j < this.size[1]; j++) { // row
      var r = Math.random();
      var x = 0.01;
      if (j > 0 && col[j-1].t === TILE.MOUNTAIN) {
        x += 0.4;
      }
      if (i > 0 && this.map[i-1][j].t === TILE.MOUNTAIN) {
        x += 0.4;
      }
      var p = TILE.FIELD;
      if (r < x) {
        p = TILE.MOUNTAIN;
      } else if (r > 0.98) {
        p = TILE.MINE;
      }

      col.push({x: i, y: j, t: p, s: false});
    }
    this.map.push(col);
  }

  this.map[30][10].t = TILE.FIELD;

  return this;
};

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
        t.s = true;
        r.push(t);
      }
    }
  }
  return r;
};

World.prototype.get = function(x,y) {
  if (arguments.length === 1) {
    y = x.y;
    x = x.x;
  }
  if (x < 0 || x >= this.size[0]) { return null; }
  if (y < 0 || y >= this.size[1]) { return null; }
  return this.map[x][y];
};

World.prototype.dig = function(x,y) {
  if (arguments.length === 1) {
    y = x.y;
    x = x.x;
  }
  if (this.canMine(x,y)) {

    var dS = 1;
    if (Math.random() > 0.75) {
      dS++;
    }
    if (Math.random() > 0.99) {
      dS++;
    }
    if (Math.random() > 0.90) {
      this.map[x][y].t = TILE.HOLE;
    }
    return dS;
  }
  return 0;
};

World.prototype.canMine = function(x,y) {
  return this.map[x][y].t === TILE.MINE;
};

World.prototype.canMove = function(x,y) {  //TODO: change to cost
  var t = this.get(x,y);
  return t !== null && t.t !== TILE.MOUNTAIN;
};

angular.module('myApp')
  .controller('MainCtrl', function ($scope, $interval) {
    var main = this;

    main.refresh = 1;

    var testCode = (function ($bot, $home, $ctrl) {  // example

if ($bot.isAt($home)) {  // is at home
  $home.chargeBot(this);
  var l = $bot.unloadTo($home);
  if (l === 0 && $bot.S === $bot.mS) { // home base full, wait
    return;
  }
} else if ($bot.S === $bot.mS) {  // storage full
  $bot.moveTo($home);
  return;
}

var s = $bot.scan();
var r = s[4];  // current position

if (r.t === 'X' && $bot.S < $bot.mS) {  // is at mine
  $bot.mine();
}

var rr = [];
for(var i = 0; i < s.length; i++) {
  r = s[i];
  if (r.t === 'X' && this.S < this.mS) {  // found a mine
    $bot.moveTo(r);
    return;
  } else if (r.t === '@' && this.S > 0) {  // found home
    $bot.moveTo(r);
    return;
  } else if (r.t !== '▲') {  // can't pass
    rr.push(r);
  }
}

if (rr.length > 0) {
  var j = Math.floor(Math.random()*rr.length);
  $bot.moveTo(rr[j]);
}

}).toString();

    main.world = new World().generate();

    var home = main.home = new Bot('Base', main.world, 30, 10);
    home.E = 0;
    home.dE = 0.1;
    home.mE = 100;
    home.mS = 10;
    home.dEdX = 1000;
    home.t = TILE.BASE;

    main.bots = [home];

    //var bot = new Bot('Rover', main.world, home.x, home.y);
    //bot.code = testCode.substring(testCode.indexOf('{') + 1, testCode.lastIndexOf('}'));

    main.world.scan(home);

    main.construct = function () {
      var bot = new Bot('Rover', main.world, main.home.x, main.home.y);
      bot.code = testCode.substring(testCode.indexOf('{') + 1, testCode.lastIndexOf('}'));
      main.bots.push(bot);
      return bot;
    };

    var bot = main.construct();

    main.setBot = function(index) {
      if (arguments.length < 1) {
        index = main.index;
      }
      main.index = index;
      bot = main.bot = main.bots[index];
      main.code = bot.code;
      main.manual = bot.manual;
      main.refresh++;
    };

    main.setBot(1);

    function getTile(x,y) {
      var tile = main.world.get(x,y);
      if (tile !== null) {
        for(var i = 0; i < main.bots.length; i++) {
          var bot = main.bots[i];
          if (isAt(bot,x,y)) { return '<strong class="bot bot-'+bot.name+'">'+bot.t+'</strong>'; }
        }
        if (tile.s) { return '<span class="tile tile-'+tile.t+'">'+tile.t+'</span>'; }
        return '&nbsp;';
      }
    }

    main.draw = function() {
      var b = '';

      for(var i = 0; i < 20; i++) {
        for(var j = 0; j < 60; j++) {
          b += getTile(j,i);
        }
        b += '\n';
      }

      return b;
    };

    main.relocate = function() {
      if (home.E >= 1000) {
        home.E -= 1000;
        main.world.generate();
        main.world.scan(home);
      }
    };

    main.upgradeBot = function(bot) {
      if (home.S >= 10) {
        home.S -= 10;
        bot.dE += 0.1;
        bot.mS += 1;
      }
    };

    main.isHome = function(bot) {
      return isAt(bot || main.bot, home);
    };

    main.canMine = function() {
      return !main.isHome() && main.world.get(bot.x,bot.y).t === TILE.MINE;
    };

    main.chargeBot = function(bot) {
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
    };

    main.get = function(dx,dy) {
      dx = Math.sign(dx);  // Scan distance = 1
      dy = Math.sign(dy);

      var x = dx+bot.x;
      var y = dy+bot.y;

      if (isAt(home,x,y)) { return { t: TILE.BASE }; }
      return main.world.get(x,y);

    };

    main.toggleBot = function(bot) {
      bot = bot || main.bot;
      if (bot.manual) {
        bot.run();
      } else {
        bot.stop();
      }
    };

    main.keypress = function($event) {  // TODO: cheat code
      switch($event.keyCode) {
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
          if (isAt(bot,home)) {
            bot.unloadTo(home);
            home.chargeBot(bot);
          } else {
            bot.mine();
          }
          break;
      }

    };

    var dT = 1;

    $interval(function tick() {
      main.bots.forEach(function(_bot) {
        bot = _bot; // hack
        _bot.takeTurn(dT, main);
      });
    }, dT*200);

  });
