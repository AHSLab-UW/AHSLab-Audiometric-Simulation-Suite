'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .factory('graphMarks', graphMarks);


function graphMarks(graphAxis, marks, configConstants) {
    var markList = [];

    var graph = {};

    graph.getMarks = getMarks;
    graph.pushResultMark = pushResultMark;
    graph.pushCursorMark = pushCursorMark;
    graph.popMark = popMark;
    graph.clearMarks = clearMarks;

    return graph;

    function getMarks() {
        return markList;
    }

    function pushResultMark(frequency, stimulus, ear, conduction, masking) {
        var top, left, mark, newConduction;
        top = graphAxis.yAxis[stimulus];
        left = graphAxis.xAxis[frequency];
        if (conduction === configConstants.AC || conduction === undefined) {
            newConduction = configConstants.AC;
            if (ear === configConstants.LEFT_EAR) {
                if (masking === configConstants.MASKING) mark = marks.AC_MASKED_LEFT;
                else mark = marks.AC_UNMASKED_LEFT;
            } else {
                if (masking === configConstants.MASKING) mark = marks.AC_MASKED_RIGHT;
                else mark = marks.AC_UNMASKED_RIGHT;
            }
        }
        if (conduction === configConstants.BC) {
            newConduction = configConstants.BC;
            if (ear === configConstants.LEFT_EAR) {
                left = graphAxis.xAxisLeftBC[frequency];
                if (masking === configConstants.MASKING) mark = marks.BC_MASKED_LEFT;
                else mark = marks.BC_UNMASKED_LEFT;
            } else {
                left = graphAxis.xAxisRightBC[frequency];
                if (masking === configConstants.MASKING) mark = marks.BC_MASKED_RIGHT;
                else mark = marks.BC_UNMASKED_RIGHT;
            }
        }

        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        frequency: frequency,
                        stimulus: stimulus,
                        ear: ear,
                        conduction: newConduction
                      };

        // if newMark has the same frequency and symbol as an older mark,
        // update the older mark to the new stimulus level
        for(var i = 0; i < markList.length; i++) {
            if (markList[i].frequency === newMark.frequency
                && markList[i].path === newMark.path) {
                markList[i].stimulus = newMark.stimulus;
                markList[i].top = newMark.top;
                return;
            }
        }

        markList.push(newMark);
    }

    function pushCursorMark(frequency, stimulus) {
        var top = graphAxis.yAxis[stimulus];
        var left = graphAxis.xAxis[frequency];
        var mark = marks.CURSOR;
        var newMark = { path : mark,
                        top  : top,
                        left : left
                      };
        markList.push(newMark);
    }

    function popMark() {
        return markList.pop();
    }

    function clearMarks() {
        markList.length = 0;
    }

}
