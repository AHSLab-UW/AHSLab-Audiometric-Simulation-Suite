'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('hearingTestApp'));

  var MainCtrl,
      scope,
      $uibModal;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    $uibModal = jasmine.createSpyObj('$uibModal', ['open']);
    MainCtrl = $controller('MainCtrl', {
      $scope: scope,
      $uibModal: $uibModal
    });
  }));

  it('should be defined', function () {
    expect(MainCtrl).toBeDefined();
  });

  describe('when openCalibration is called, it', function() {
    it('should call $uibModal.open', function() {
      MainCtrl.openCalibration();
      expect($uibModal.open).toHaveBeenCalled();
    });
  });

});
