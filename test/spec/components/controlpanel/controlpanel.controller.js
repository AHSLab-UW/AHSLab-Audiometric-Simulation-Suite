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
        module('hearingTestApp');

        uibModalMock = jasmine.createSpyObj('$uibModal', ['open']);

        // spyOn(controlPanelMock, 'setFrequency').and.callThrough();
        // spyOn(controlPanelMock, 'getFrequency').and.callThrough();

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

    // describe('when decreaseFrequency is called, it', function() {
    //     it('should have a minimum value of 125Hz', function() {
    //         console.log(controlPanelMock.getFrequency());
    //         for(var i = 0; i < 100; i++) {
    //             ControlPanelCtrl.decreaseFrequency();
    //         }
    //         var actualFrequency = ControlPanelCtrl.getFrequency();
    //         var minFrequency = 125;
    //         expect(actualFrequency).toBe(minFrequency);
    //     });
    // });

    // describe('when increaseFrequency is called, it', function() {
    //     it('should have a maximum value of 12000Hz', function() {
    //         for(var i = 0; i < 100; i++) {
    //             ControlPanelCtrl.increaseFrequency();
    //         }
    //         var actualFrequency = ControlPanelCtrl.getFrequency();
    //         var maxFrequency = 125;
    //         expect(actualFrequency).toBe(maxFrequency);
    //     });
    // });
});


