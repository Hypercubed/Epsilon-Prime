
(function() {
'use strict';

  angular.module('ePrime')
  .service('modals',function($modal) {
    var modals = this;

    modals.pauseConfirm = function(message,showReset) {
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
    };

    return modals;
  })
  .controller('ConfirmInstanceCtrl', function ($scope, data, GAME) {

    $scope.game = GAME;
    $scope.message = data.message;
    $scope.showReset = data.showReset;

  });

})();
