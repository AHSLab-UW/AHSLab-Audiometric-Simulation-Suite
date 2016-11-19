'use-strict';

describe('Directive: simulator', function() {

    var element;
    var scope;

    beforeEach(function() {
        module('hearingTestApp.simulator');

        inject(function($rootScope) {
            scope = $rootScope.$new();
        });
    });

    it('should make hidden element visible', inject(function($compile) {
        element = angular.element('<simulator></simulator>');
        element = $compile(element)(scope);
        expect(element.text()).toBe('');
    }));
});
