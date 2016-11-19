'use strict';

describe('Controller: MainCtrl', function() {


    var MainCtrl;

    // Initialize the controller and a mock scope
    beforeEach(function() {
        module('hearingTestApp');

        inject(function($controller) {
            MainCtrl = $controller('MainCtrl', {});
        });
    });

    it('should be defined', function() {
        expect(MainCtrl).toBeDefined();
    });

});
