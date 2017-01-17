'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .directive('graphMarks', graphMarksDirective);


function graphMarksDirective(graphMarks, controlPanel) {
    return {
        templateUrl: 'components/graphmarks/graphmarks.html',
        scope: {},
        restrict: 'E',
        replace: false,
        controller: function() {},
        controllerAs: 'vm',
        bindToController: true,
        link: postLink
    };

    function postLink(scope, element, atttribute, ctrl) {
        ctrl.marks = graphMarks.getMarks();
    }

}
