'use strict';

angular.module('myApp')
  .value('TILES', {
    MOUNTAIN: '▲',
    FIELD: '.',
    MINE: 'X',
    HILL: ',',
    BOT: 'A',
    BASE: '@',
    HOLE: 'O'
  })
  .factory('World', function (TILES) {

    function World() {

    }

    World.prototype.generate = function(xs,ys) {
      xs = xs||60;
      ys = ys||60;

      this.size = [xs, ys];  // cols, rows

      var x, y;

      this.map = new Array(xs);       // todo: improve storage

      for(x = 0; x < xs; x++) {  // col
        this.map[x] = new Array(ys);
        for(y = 0; y < ys; y++) { // row
          this.map[x][y] = this.chooseTile(x,y);   // todo: improve storage, store only strings again?
        }
      }

      return this;
    };

    World.prototype.chooseTile = function(x,y) {
      var pm = 0.01;  // Probability of a mountain
      if (y > 0 && this.map[x][y-1].t === TILES.MOUNTAIN) {
        pm += 0.4;
      }
      if (x > 0 && this.map[x-1][y].t === TILES.MOUNTAIN) {
        pm += 0.4;
      }

      var p;
      var r = Math.random();
      if (r < pm) {
        p = TILES.MOUNTAIN;
      } else if (r > 0.98) {
        p = TILES.MINE;
      } else {
        p = TILES.FIELD;
      }

      return {x: x, y: y, t: p, s: false};   // todo: improve storage, store only strings again?
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

    World.prototype.scanList = function() {
      var xs = this.size[0];
      var ys = this.size[0];
      var r = [];
      for(var i = 0; i < xs; i++) {
        for(var j = 0; j < ys; j++) {
          var t = this.get(i,j);
          if (t !== null && t.s === true && t.t === 'X') {
            r.push(t);
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
    };

    function poisson(mean) {
      var limit = Math.exp(-mean);

      return function() {
        var n = 0,
        x = Math.random();

        while(x > limit){
          n++;
          x *= Math.random();
        }
        return n;
      };
    }

    var digYield = poisson(1.26);
    var mineMTTF = 0.05;

    World.prototype.dig = function(x,y) {
      if (arguments.length === 1) {
        y = x.y;
        x = x.x;
      }
      if (this.canMine(x,y)) {

        var dS = digYield();
        if (dS > 0 && Math.random() < mineMTTF) {
          this.map[x][y].t = TILES.HOLE;
        }
        return dS;
      }
      return 0;
    };

    World.prototype.canMine = function(x,y) {
      return this.map[x][y].t === TILES.MINE;
    };

    World.prototype.canMove = function(x,y) {  //TODO: change to cost
      var t = this.get(x,y);
      return t !== null && t.t !== TILES.MOUNTAIN;
    };

    return World;
  });
