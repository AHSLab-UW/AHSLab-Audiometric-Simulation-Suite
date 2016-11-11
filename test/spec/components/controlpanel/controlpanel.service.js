'use strict';

describe('Service: controlPanel', function() {

    var controlPanel;

    beforeEach(function() {
<<<<<<< HEAD
        module('hearingTestApp');
=======
        module('hearingTestApp.controlPanel');
>>>>>>> raised test coverage to 100%
        inject(function(_controlPanel_) {
            controlPanel = _controlPanel_;
        });
    });


    it('should be able to get an instance of the factory', function() {
        expect(!!controlPanel).toBe(true);
    });

    describe('when resetState is called, it', function() {
        it('should set option back to its initial value', function() {
            var before = controlPanel.getOption();

            controlPanel.setOption({"foo": "bar"});
            controlPanel.resetState();

            var after = controlPanel.getOption();

            expect(before).toEqual(after);
        });

        it('should set side back to its initial value', function() {
            var before = controlPanel.getSide();

            controlPanel.setSide(1);
            controlPanel.resetState();

            var after = controlPanel.getSide();

            expect(before).toEqual(after);
        });

        it('should set frequency back to its initial value', function() {
            var before = controlPanel.getFrequency();

            controlPanel.setFrequency(1);
            controlPanel.resetState();

            var after = controlPanel.getFrequency();

            expect(before).toEqual(after);
        });

        it('should set stimulus back to its initial value', function() {
            var before = controlPanel.getStimulus();

            controlPanel.setStimulus(1);
            controlPanel.resetState();

            var after = controlPanel.getStimulus();

            expect(before).toEqual(after);
        });
    });
});
