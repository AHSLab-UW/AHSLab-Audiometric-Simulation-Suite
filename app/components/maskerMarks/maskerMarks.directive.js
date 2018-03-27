/**
 * Created by heads on 3/27/2018.
 */
'use-strict';


angular
  .module('hearingTestApp.graphMarks')
  .directive('maskerMarks', maskerMarksDirective);


function maskerMarksDirective(maskerMarks, controlPanel) {
  return {
    templateUrl: 'components/maskermarks/maskermarks.html',
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
