(function() {
  'use strict';

  function ListController($scope, hotkeys) {

    $scope.page = 1;

    //console.log($scope.openItem.name);

    $scope.item = $scope.openItem;
    $scope.opened = false;
    $scope.search = { name: '' };

    $scope.select = function(item) {
      $scope.openItem = $scope.item = item;
      $scope.items.forEach(function(d) {
        d.active = d === item;
      });
    };

    $scope.open = function(item){
      $scope.select(item);
      $scope.page = $scope.items.indexOf(item)+1;
      $scope.opened = true;
    };

    $scope.pageChanged = function(page) {
      var item = $scope.items[page-1];
      $scope.select(item);
    };

    $scope.close = function() {
      $scope.opened = false;
    };

    hotkeys.bindTo($scope)
    .add({
      combo: 'k',
      //description: 'next bot',
      callback: function() {
        $scope.page = Math.min($scope.page+1, $scope.items.length);
        $scope.pageChanged($scope.page);
      }
    })
    .add({
      combo: 'j',
      //description: 'prev bot',
      callback: function() {
        $scope.page = Math.max($scope.page-1, 1);
        $scope.pageChanged($scope.page);
      }
    });

  }

  angular.module('ePrime')
  .controller('ListController', ListController)
  .directive('slidingListInject', function(){
    return {
      require: '^slidingList',
      link: function($scope, $element, $attrs, controller, $transclude) {

        //console.log(controller.parent);

        /* if (!$transclude) {
          throw minErr('ngTransclude')('orphan',
          'Illegal use of ngTransclude directive in the template! ' +
          'No parent directive that requires a transclusion found. ' +
          'Element: {0}',
          startingTag($element));
        } */

        var innerScope = controller.parent.$new();
        innerScope[controller.valueKey] = $scope.item;
        innerScope.opened = $scope.opened;

        $scope.$watch('item', function(val) {
          innerScope[controller.valueKey] = val;
        });

        $transclude(innerScope, function(clone) {
          $element.empty();
          $element.append(clone);
          $element.on('$destroy', function() {
            innerScope.$destroy();
          });
        });
      }
    };
  })
  .directive('slidingList', function() {
    return {
      restrict: 'AE',
      transclude: true,
      scope: {
        openItem: '=item'
      },
      controller: 'ListController',
      templateUrl: 'components/list/list-template.html',
      link: function link($scope, $element, $attrs, controller) {

        var expression = $attrs.slidingList;
        var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

        var lhs = match[1];
        var rhs = match[2];

        $scope.items = $scope.$parent.$eval(rhs);

        controller.parent = $scope.$parent;
        controller.valueKey = lhs;
      }
    };
  });

})();
