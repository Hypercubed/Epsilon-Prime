function ListController($scope) {

  $scope.page = 1;

  $scope.openItem = $scope.item = undefined;
  $scope.opened = false;
  $scope.search = { name: '' };

  $scope.select = function(item) {
    $scope.openItem = $scope.item = item;
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

}

function MainController() {
  var main = this;

  main.title = 'test';

  main.items = [];

  for(var i = 1; i <= 26; i++) {
    main.items.push({i: i-1, id: String.fromCharCode(12352+i), name: 'item'+i, content: 'item'+i, text: 'iiiiitem'+i});
  }
}


angular.module('myApp')
.controller('ListController', ListController)
.controller('MainController', MainController)
.directive('slidingListInject', function(){
  return {
    require: '^slidingList',
    link: function($scope, $element, $attrs, controller, $transclude) {

      //console.log(controller.parent);

      if (!$transclude) {
        throw minErr('ngTransclude')('orphan',
        'Illegal use of ngTransclude directive in the template! ' +
        'No parent directive that requires a transclusion found. ' +
        'Element: {0}',
        startingTag($element));
      }

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
.directive('slidingList', function($parse) {
  return {
    restrict: 'AE',
    transclude: true,
    scope: {},
    controller: 'ListController',
    templateUrl: 'components/list/list-template.html',
    link: function link($scope, $element, $attrs, controller) {

      var expression = $attrs.slidingList;
      var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

      var lhs = match[1];
      var rhs = match[2];

      $scope.items = $parse(rhs)($scope.$parent);

      /* if ($attrs.ngModel) {
          $scope.openItem = $parse($attrs.ngModel)($scope.$parent);
        } else {
        $scope.openItem = undefined;
      } */

      controller.parent = $scope.$parent;
      controller.valueKey = lhs;
    }
  };
});
