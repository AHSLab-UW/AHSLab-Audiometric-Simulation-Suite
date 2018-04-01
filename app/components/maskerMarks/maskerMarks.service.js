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
        console.log(maskList);
        return maskList;
    }

    function pushResultMask(frequency, row , value) {
        if(frequency === 125 || frequency === 12000) {
          return
        }
        // Push the new mark
        console.log(maskAxis.top[row]);

        for(var i = 0; i < maskList.length; i++) {
          console.log(maskList[i]);
          if (maskList[i].frequency === frequency && maskList[i].row === row) {
            maskList[i].value = value;
            console.log('col');
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
      console.log('clear');
      maskList.length = 0;
    }

}

