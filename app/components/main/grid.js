/* global _F:true */
/* global d3:true */

(function() {

  'use strict';

  d3.charts = d3.charts || {};

  d3.charts.Grid = function Grid() {  // TODO: move
    var margin = {top: -5, right: -5, bottom: -5, left: -5},
      width = 500 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

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

    function my(selection) {
      selection.each(function(d) {

        width = selection[0][0].clientWidth || 500;
        width = width - margin.left - margin.right;

        var tiles = d[0];  // TODO: not this
        var bots = d[1];

        function clicked(d) {  // TODO: dispatch

          botsWrap
            .classed('active', function(_d) {
              _d.active = (d === _d);
              return _d.active;
            });

          dispatch.click(d);

        }

        function hover(d) {
          var t = d.name || '';
          text.text(t+'@'+[d.x,d.y]);
        }

        if (!container) {
          //$log.debug('draw new');

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

        } else {


          //gBotsLayer = container.select('.botsLayer');
          //gTilesLayer = container.select('.tilesLayer');

          //text = d3.select(this).select('.hover-text');

          //gTilesLayer.selectAll('.tile').remove();  // todo: not this
          //gBotsLayer.selectAll('.bot').remove();  // todo: not this
        }

        var tilesWrap = gTilesLayer
          .selectAll('.tile').data(tiles);

        tilesWrap.enter()
          .append('g')
          .attr('class', 'tile')
          .attr('transform', function(d) {
            return 'translate('+[_X(d),_Y(d)]+')';
          })
          //.on('click', clicked)
          .on('mouseenter', hover)
          .on('mouseleave', function() {
            text.text('');
          })
          .append('text')
          .attr(textAttr)
          .text(_tile);

        tilesWrap
          .attr('transform', function(d) {
            return 'translate('+[_X(d),_Y(d)]+')';
          })
          .select('text')
          .text(_tile);

        var botsWrap = gBotsLayer
          .selectAll('.bot').data(bots);

        var gBotsEnter = botsWrap.enter()
          .append('g')
          .attr('class', function(d) {
            return 'bot bot-'+d.name.toLowerCase();
          })
          .on('click', clicked)
          .on('mouseenter', hover)
          .on('mouseleave', function() {
            text.text('');
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

        botsWrap
          .classed('active', function(d) {
            return d.active;
          })
          .attr('transform', function(d) {
            return 'translate('+[_X(d),_Y(d)]+')';
          })
          .select('text').text(_tile);


        //gBots
          //  .append('text')
          //    .attr(textAttr)
          //    .text(_tile);

      });
    }

    d3.rebind(my, dispatch, 'on');

    return my;
  };

})();
