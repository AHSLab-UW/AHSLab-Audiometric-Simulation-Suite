'use-strict';

describe('Controller: ControlPanelCtrl', function() {

    var ControlPanelCtrl;
    var uibModalMock;
    var controlPanelMock;
    var defaultEar = 0;

    controlPanelMock = {
        frequency: 250,
        stimulus: 75,
        setFrequency: function(newFrequency) {
            this.frequency = newFrequency;
        },
        getFrequency: function() {
            return this.frequency;
        },
        setStimulus: function(newStimulus) {
            this.stimulus = newStimulus;
        },
        getStimulus: function() {
            return this.stimulus;
        }
    };

    beforeEach(function() {
        module('hearingTestApp.controlPanel');

        uibModalMock = jasmine.createSpyObj('$uibModal', ['open']);

        spyOn(controlPanelMock, 'setFrequency').and.callThrough();
        spyOn(controlPanelMock, 'getFrequency').and.callThrough();
        spyOn(controlPanelMock, 'setStimulus').and.callThrough();
        spyOn(controlPanelMock, 'getStimulus').and.callThrough();

        inject(function($controller) {
            ControlPanelCtrl = $controller('ControlPanelCtrl', {
                $uibModal: uibModalMock,
                controlPanel: controlPanelMock
            });
        });
    });

    it('should be able to get instance of the controller', function() {
        expect(ControlPanelCtrl).toBeDefined();
    });

    describe('when openCalibration is called, it', function() {
        it('should call $uibModal.open', function() {
            ControlPanelCtrl.openCalibration();
            expect(uibModalMock.open).toHaveBeenCalled();
        });
    });

    describe('when decreaseFrequency is called, it', function() {
        it('should call controlPanel.setFrequency', function() {
            ControlPanelCtrl.decreaseFrequency();
            expect(controlPanelMock.setFrequency).toHaveBeenCalled();
        });

        it('should have a minimum value of 125Hz', function() {
            for(var i = 0; i < 100; i++) {
                ControlPanelCtrl.decreaseFrequency();
            }
            var actualFrequency = controlPanelMock.getFrequency();
            var minFrequency = 125;
            expect(actualFrequency).toBe(minFrequency);
        });
    });

    describe('when increaseFrequency is called, it', function() {
        it('should have a maximum value of 12000Hz', function() {
            for(var i = 0; i < 100; i++) {
                ControlPanelCtrl.increaseFrequency();
            }
            var actualFrequency = controlPanelMock.getFrequency();
            var maxFrequency = 12000;
            expect(actualFrequency).toBe(maxFrequency);
        });

        it('should call controlPanel.setFrequency', function() {
            ControlPanelCtrl.increaseFrequency();
            expect(controlPanelMock.setFrequency).toHaveBeenCalled();
        });
    });

    describe('when decreaseStimulus is called, it', function() {
        it('should have a maximum value of 12000Hz', function() {
            for(var i = 0; i < 100; i++) {
                ControlPanelCtrl.decreaseStimulus();
            }
            var actualStimulus = controlPanelMock.getStimulus();
            var minStimulus = -10;
            expect(actualStimulus).toBe(minStimulus);
        });

        it('should call controlPanel.setStimulus', function() {
            ControlPanelCtrl.decreaseStimulus();
            expect(controlPanelMock.setStimulus).toHaveBeenCalled();
        });
    });

    describe('when increaseStimulus is called, it', function() {
        it('should have a maximum value of 12000Hz', function() {
            for(var i = 0; i < 100; i++) {
                ControlPanelCtrl.increaseStimulus();
            }
            var actualStimulus = controlPanelMock.getStimulus();
            var maxStimulus = 120;
            expect(actualStimulus).toBe(maxStimulus);
        });

        it('should call controlPanel.setStimulus', function() {
            ControlPanelCtrl.increaseStimulus();
            expect(controlPanelMock.setStimulus).toHaveBeenCalled();
        });
    });
});
