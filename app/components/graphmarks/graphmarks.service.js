'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .factory('graphMarks', graphMarks);


function graphMarks(marks) {
    var markList = [];

    var graph = {};

    graph.getMarks = getMarks;
    graph.pushMark = pushMark;
    graph.popMark = popMark;

    return graph;


    /*
     * Returns the list of marks.
     */
    function getMarks() {
        return markList;
    }

    /*
     * Validates the input and pushs it to the list.
     * All parameters are strings. Valid params can
     * be found in marks.constant.js
     */
    function pushMark(mark, top, left) {
        var newMark = { path : mark,
                        top  : top,
                        left : left
                      };
        markList.push(newMark);
        console.log(markList);
    }

    /*
     * Pops the last item that was inserted in the stack.
     */
    function popMark() {
        return markList.pop();
    }

}
