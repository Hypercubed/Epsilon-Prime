
(function() {
'use strict';

angular.module('myApp')
  .service('modals',function($modal) {
    return {
      pauseConfirm: function(message,showReset) {
        return $modal.open({
          templateUrl: 'components/modals/confirm-model.html',
          backdrop: 'static',
          keyboard: true,
          size: 'lg',
          controller: 'ConfirmInstanceCtrl',
          resolve: {
            data: function() {
              return {
                message: message,
                showReset: showReset
              };
            }
          }
        });
      }
    }
  })
  .controller('ConfirmInstanceCtrl', function ($scope, data, GAME) {

    $scope.game = GAME;
    $scope.message = data.message;
    $scope.showReset = data.showReset;

  });

})();

