'use-strict';


angular
    .module('hearingTestApp.maskerMarks')
    .factory('maskerMarks', maskerMarks);


function maskerMarks(maskAxis, configConstants) {
    var masks = {};
    var maskList = [];

    masks.getMasks = getMasks;
    masks.pushResultMask = pushResultMask;
    masks.clearMasks = clearMasks;

    return masks;

    function getMasks() {
        return maskList;
    }

    function pushResultMask(frequency, row , value) {
        // Push the new mark
        for(var i = 0; i < maskList.length; i++) {
          if (maskList[i].frequency === frequency && maskList[i].row === row) {
            maskList[i].value = value;
            return;
          }
        }

        maskList.push({
          row : row,
          frequency : frequency,
          top  : maskAxis.top[row],
          left : maskAxis.left[frequency],
          value: value,
          width: maskAxis.width[frequency],
        });
    }

    // ClearMarks clears the canvas objects, lines drawn, and symbols
    function clearMasks() {
      maskList.length = 0;
    }

}

