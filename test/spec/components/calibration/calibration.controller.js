'use strict';

describe('Controller: CalibrationCtrl', function () {

  // load the controller's module
  beforeEach(module('hearingTestApp.calibration'));

  var CalibrationCtrl,
      scope,
      $uibModalInstance,
      webAudioContextFactory,
      audioContext,
      oscillator,
      gainNode;

  oscillator = {
    start: function() {},
    stop: function() {},
    connect: function() {},
    type: '',
    frequency: {value: 0}
  };

  gainNode = {
    connect: function() {},
    gain: {value: 0}
  };

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    $uibModalInstance = jasmine.createSpyObj('$uibModalInstance', ['close']);
    audioContext = jasmine.createSpyObj('AudioContext', ['createOscillator', 'createGain']);
    webAudioContextFactory = jasmine.createSpyObj('webAudioContextFactory', ['getInstance']);
    audioContext.createOscillator.and.returnValue(oscillator);
    audioContext.createGain.and.returnValue(gainNode);
    webAudioContextFactory.getInstance.and.returnValue(audioContext);
    $uibModalInstance.result = { finally: function() {} };

    CalibrationCtrl = $controller('CalibrationCtrl', {
      $scope: scope,
      $uibModalInstance: $uibModalInstance,
      audioContext: audioContext,
      webAudioContextFactory: webAudioContextFactory
    });
  }));

  it('should set isPlaying to true when the tone starts', function() {
    CalibrationCtrl.startTone();
    expect(CalibrationCtrl.isPlaying).toBe(true);
  });

  it('should create a new oscillator when the tone starts', function() {
    CalibrationCtrl.startTone();
    expect(audioContext.createOscillator).toHaveBeenCalled();
  });

  it('should set isPlaying to false when the tone stops', function() {
    CalibrationCtrl.startTone();
    CalibrationCtrl.stopTone();
    expect(CalibrationCtrl.isPlaying).toBe(false);
  });

  it('should call $uibModalInstance.close when close is called', function() {
    CalibrationCtrl.close();
    expect($uibModalInstance.close).toHaveBeenCalled();
  });

});
