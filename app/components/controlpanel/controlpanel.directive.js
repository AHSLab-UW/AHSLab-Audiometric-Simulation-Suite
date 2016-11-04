(function () {

    'use strict';

    /**
     * @ngdoc directive
     * @name hearingTestApp.directive:controlpanel
     * @description
     * # controlpanel
     */
    angular.module('hearingTestApp.controlPanel')
        .directive('controlPanel', controlPanel);

    /** @ngInject */
    function controlPanel() {
        return {
            templateUrl: 'components/controlpanel/controlpanel.html',
            scope: {},
            restrict: 'E',
            replace: true,
            controller: 'ControlPanelCtrl',
            controllerAs: 'vm',
            bindToController: true
        };
    }

}());
