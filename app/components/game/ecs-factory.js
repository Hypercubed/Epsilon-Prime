/* global _F:true */
/* global Aether: true */
/* global darlingjs: true */

(function() {
  'use strict';

  angular.module('ePrime')
  .factory('Entity', function() {
    function Entity() {}

    Entity.prototype.$add = function(key, instance) {
      this[key] = this[key] || {};
      if (instance) {
        angular.extend(this[key], instance);
      }
    };

    Entity.prototype.$remove = function(key) {
      delete this[key];
    };

    return Entity;
  })
  .factory('EcsFactory', function(Entity, $timeout) {

    function Ecs(opts) {
      this.components = {};
      this.systems = {};
      this.entities = [];

      this.$uuid = 0;
      this.$timer = null;
      this.$playing = false;
      this.$delay = 1000;
      this.$interval = 1;

      angular.extend(this, opts);
    }

    Ecs.prototype.$c = function(key, value) {
      this.components[key] = value;
    };

    Ecs.prototype.$s = function(key, value) {
      this.systems[key] = value;
    };

    Ecs.prototype.$e = function(id, instance) {
      var self = this;

      if (arguments.length < 2) {
        instance = id;
        id = ''+this.$uuid++;
      }
      var e = new Entity();

      angular.extend(e, instance);

      angular.forEach(e, function(value, key) {
        var component = self.components[key];
        e.$add(key, component);
      });

      this.$onComponentAdd(e);
      this.entities[id] = e;
      return e;
    };

    Ecs.prototype.$onComponentAdd = function(entity) {
      //console.log('$onComponentAdd', this.systems);
      angular.forEach(this.systems, function(system) {
        if (system.$addEntity) {
          // todo: check requires
          system.$addEntity(entity);
        }
      });
    };

    Ecs.prototype.$update = function(time) {
      var self = this;
      angular.forEach(this.systems, function(system) {
        if (system.$update) {
          // todo: check requires
          system.$update(self.entities, time);
        }
      });
    };

    Ecs.prototype.$start = function() {
      if (this.$playing) {return;}

        var self = this;

        self.$playing = true;

        function tick() {
          self.$update(self.$interval);
          self.$timer = $timeout(tick, self.$delay); // make variable
        }

        tick();
      };

      Ecs.prototype.$stop = function() {
        this.$playing = false;
        if (this.$timer) {$timeout.cancel(this.$timer);}
      };

      return Ecs;

    })
  .service('ecs', function(EcsFactory) {
    var ecs = new EcsFactory();

    return ecs;
  });

})();
