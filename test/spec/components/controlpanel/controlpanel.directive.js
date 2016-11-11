'use strict';

describe('Directive: controlPanel', function () {

    var element,
        scope;

    // load the directive's module
    beforeEach(function() {
        module('hearingTestApp');

        inject(function($rootScope) {
            scope = $rootScope.$new();
        });
    });

    it('should make hidden element visible', inject(function ($compile) {
        element = angular.element('<control-panel></control-panel>');
        element = $compile(element)(scope);
        expect(element.text()).toBe('');
    }));
});
