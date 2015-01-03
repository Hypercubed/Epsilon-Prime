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
          if (j > 0 && col[j-1].t === TILES.MOUNTAIN) {
            x += 0.4;
          }
          if (i > 0 && this.map[i-1][j].t === TILES.MOUNTAIN) {
            x += 0.4;
          }
          var p = TILES.FIELD;
          if (r < x) {
            p = TILES.MOUNTAIN;
          } else if (r > 0.98) {
            p = TILES.MINE;
          }

          col.push({x: i, y: j, t: p, s: false});
        }
        this.map.push(col);
      }

      this.map[30][10].t = TILES.FIELD;  // base

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
