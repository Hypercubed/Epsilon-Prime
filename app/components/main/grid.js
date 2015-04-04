/* global _F:true */
/* global d3:true */
/*jshint -W040 */

(function() {

  'use strict';

  d3.charts = d3.charts || {};

  d3.charts.Grid = function Grid() {  // TODO: move
    var margin = {top: -5, right: -5, bottom: -5, left: -5},
      width = 500,
      height = 500;

    var _tile = _F('t');
    //var _x = _F('x');
    //var _y = _F('y');

    var xScale = d3.scale.linear()
      .range([0, width])
      .domain([0,60]);
    var yScale = d3.scale.linear()
      .range([0, height])
      .domain([0,60]);

    var dx = xScale(1); //, dy = yScale(1);

    var _X = _F('x', xScale),
        _Y = _F('y', yScale);

    //var _pos = function(d) {
    //  return [_X(d),_Y(d)];
    //};

    //var _posId = function(d) {
    //  return '@'+[d.x,d.y];
    //};

    var _translate = function(d) {
      return 'translate('+[_X(d),_Y(d)]+')';
    };

    var _id = _F('_id');
    var _botTile = _F('bot.t');

    var textAttr = {
      'text-anchor': 'middle',
      'alignment-baseline': 'middle',
      x: 0,
      y: 0
    };

    var container, svg, gBotsLayer, gTilesLayer, text;

    function zoomed() {
      container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }

    var zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', zoomed);

    var dispatch = d3.dispatch('click');

    function clicked(d) {  // TODO: dispatch
      dispatch.click(d);
    }

    function hover(d) {
      var t = d.name || '';
      text.text(t+'@'+[d.x,d.y]);
    }

    function my(selection) {
      selection.each(function(d) {

        var chunks = d[0];  // TODO: not this
        var bots = d[1];

        if (!container) {
          //$log.debug('draw new');

          width = selection[0][0].clientWidth || width;
          width = width - margin.left - margin.right;

          height = selection[0][0].clientHeight || height;
          height = height - margin.top - margin.bottom;

          svg = d3.select(this)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')')
            .call(zoom);

          svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all');

          container = svg.append('g');

          gTilesLayer = container.append('g').attr('class','tilesLayer');
          gBotsLayer = container.append('g').attr('class','botsLayer');

          text = svg.append('g')
            .attr('class','hover-text')
            .attr('transform', 'translate(10,20)')
            .append('text')
            .attr({
              'text-anchor': 'start',
              'alignment-baseline': 'top',
              x: 0,
              y: 0
            })
            .text('');

        }

        var gChunkWrap;
        function drawChunks(chunks) {

          gChunkWrap = gTilesLayer
            .selectAll('.chunk').data(chunks, _id);

          gChunkWrap.enter()
            .append('g')
            .attr('transform', 'translate(0,0)')
            .attr('class','chunk');

          updateChunks();

        }

        function updateChunks() {

          gChunkWrap
            .each(_renderChunk);

        }



        function _renderChunk(d) {
          if (d.chunk.$hash === 0) { return; }  // dirty check
          d.chunk.$hash = 0;

          var tiles =  d.chunk.getTilesArray();

          var tilesWrap = d3.select(this)
            .selectAll('.tile').data(tiles);

          tilesWrap.enter()
            .append('g')
            .attr('class', 'tile')
            //.attr('transform', _translate)
            .on('click', clicked)
            .on('mouseenter', hover)
            .on('mouseleave', function() {
              text.text('');
            })
            .append('text')
            .attr(textAttr)
            //.text(_tile)
            ;

          tilesWrap  // shouldn't need to do this but tiles change order and text
            .attr('transform', _translate)
            .select('text')
            .text(_tile);
        }

        var botsWrap;
        function drawBots(bots, dT) {
          botsWrap = gBotsLayer
            .selectAll('.bot').data(bots, _id);

          var gBotsEnter = botsWrap.enter()
            .append('g')
            .attr('class', function() {
              return 'bot';
            })
            .on('click', clicked)
            .on('mouseenter', hover)
            .on('mouseleave', function() {
              text.text('');
            })
            .attr('transform', function(d) {
              return _translate(d.bot);
            });

          gBotsEnter
            .append('circle')
            .attr({
              r: 1.2*dx,
              cx: 0,
              cy: 0
            });

          gBotsEnter
            .append('text')
            .attr(textAttr);

          botsWrap.exit().remove();

          updateBots(dT);

        }

        function updateBots() {

          botsWrap
            .classed('active', function(d) {
              return d.active;
            })
            .select('text')
              .text(_botTile);

          botsWrap
            //.transition().duration(dT > 0 ? dT : 250)
            .attr('transform', function(d) {
              return _translate(d.bot);
            });

        }

        drawChunks(chunks);
        drawBots(bots);

        my.drawBots = drawBots;
        my.updateBots = updateBots;
        //my.renderTiles = renderTiles;
        my.drawChunks = drawChunks;
        my.updateChunks = updateChunks;

        my.zoomTo = function(x,y) {
          var s = zoom.scale();
          x = -xScale(x)*s+width/2;
          y = -yScale(y)*s+height/2;
          zoom.translate([x,y]).event(svg);
        };

      });
    }

    d3.rebind(my, dispatch, 'on');

    return my;
  };

})();
