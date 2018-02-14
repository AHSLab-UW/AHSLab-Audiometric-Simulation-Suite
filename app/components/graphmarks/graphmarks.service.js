'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .factory('graphMarks', graphMarks);


function graphMarks(graphAxis, marks, configConstants) {
    var markList = [];
    // MarkJ (Mark JSON) stores the mark list and mark locations in a JSON Object
    let markJ = [{
        "lm": [{}],
        "lu": [{}],
        "rm": [{}],
        "ru": [{}]
    }];
    var graph = {};
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var prvX = null;
    var prvY = null;
    // Black = '#000000'
    // Red = '#C1272D'
    // Blue = '#0000FF'
    let black = '#000000';
    let red = '#C1272D';
    let blue = '#0000FF';

    graph.getMarks = getMarks;
    graph.pushResultMark = pushResultMark;
    graph.pushCursorMark = pushCursorMark;
    graph.popMark = popMark;
    graph.clearMarks = clearMarks;

    return graph;

    function getMarks() {
        return markList;
    }

    function getXY(ax,ay,bx,by) {
      var angleRad = Math.atan((ay-by)/(ax-bx));
      var angleDeg = angleRad * 180 / Math.PI;
      return angleRad;
    }

    function pushResultMark(frequency, stimulus, ear, conduction, masking, response) {
        if(frequency === 125 || frequency === 12000) {
          return
        }
        var top, left, mark, newConduction, width, height;
        top = graphAxis.yAxis[stimulus];
        left = graphAxis.xAxis[frequency];
        let markType = false;
        // The following is the nested if-else code for determining ear, masker, response, and conduction type
        if (conduction === configConstants.AC || conduction === undefined) {
          newConduction = configConstants.AC;
          width = 15;
          height = 15;
          if (ear === configConstants.LEFT_EAR) {
            if (masking === configConstants.MASKING){
                if (response === configConstants.RESPONSE){
                  mark = marks.AC_MASKED_LEFT;
                  markType = "lm";
                } else {
                  mark = marks.AC_MASKED_LEFT_NO;
                  width = 20;
                  height = 20;
                }
            } else {
              if (response === configConstants.RESPONSE){
                mark = marks.AC_UNMASKED_LEFT;
                markType = "lu";
              } else {
                mark = marks.AC_UNMASKED_LEFT_NO;
                width = 20;
                height = 20;
              }
            }
            left = (parseInt(graphAxis.xAxis[frequency].split('p')[0]) +1 ) + 'px';
          } else {
            if (masking === configConstants.MASKING){
              if (response === configConstants.RESPONSE) {
                mark = marks.AC_MASKED_RIGHT;
                markType = "rm";
              } else {
                mark = marks.AC_MASKED_RIGHT_NO;
                width = 20;
                height = 20;
                left = (parseInt(graphAxis.xAxis[frequency].split('p')[0]) -4 ) + 'px';
              }
            } else{
              if (response === configConstants.RESPONSE) {
                mark = marks.AC_UNMASKED_RIGHT;
                markType = "ru";
              } else {
                mark = marks.AC_UNMASKED_RIGHT_NO;
                width = 20;
                height = 20;
                left = (parseInt(graphAxis.xAxis[frequency].split('p')[0]) -4) + 'px';
              }
            }
          }
        } else if(conduction === configConstants.BC) {
            newConduction = configConstants.BC;
            width = 15;
            height = 15;
            if (ear === configConstants.LEFT_EAR) {
                if (masking === configConstants.MASKING){
                  if (response === configConstants.RESPONSE){
                    left = graphAxis.xAxisLeftBC[frequency];
                    mark = marks.BC_MASKED_LEFT;
                  } else {
                    left = graphAxis.xAxisLeftBC[frequency];
                    mark = marks.BC_MASKED_LEFT_NO;
                    width = 20;
                    height = 20;
                  }
                } else {
                  if (response === configConstants.RESPONSE) {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0]) + 2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT;
                    width = 25;
                    height = 12;
                  } else {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0])+2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT_NO;
                    width = 27;
                    height = 20;
                  }
                }
            } else {
                if (masking === configConstants.MASKING) {
                  if (response === configConstants.RESPONSE) {
                    mark = marks.BC_MASKED_RIGHT;
                    left = graphAxis.xAxisRightBC[frequency];
                  } else {
                    mark = marks.BC_MASKED_RIGHT_NO;
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0]) - 6.5) + 'px';
                    width = 20;
                    height = 20;
                  }
                } else {
                  if (response === configConstants.RESPONSE) {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0]) + 2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT;
                    width = 25;
                    height = 12;
                  } else {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0])+2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT_NO;
                    width = 27;
                    height = 20;
                  }
                }
            }
        }

        // The following takes location of symbols and passes it into the JSON, used for marking path
        var x =parseInt(left.split('p')[0]) + 8;
        var y =parseInt(top.split('p')[0]) + 8;

        // Structure our info
        if(markType){
          markJ[0][markType][0][frequency.toString()] = { "frequency": frequency, "stimulus": stimulus, "left":x,"top":y};
        }

        // Sorts the info so the line is drawn from lowest freq to highest
        Object.keys(markJ[0]).forEach(function(key) {
          markJ[0][key].sort(function(a, b){
            return a.frequency - b.frequency;
          });
        });

        // Calls draw function with the marks JSON
        drawPath(markJ);

        // This is the data structure used for export on the mark list
        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        frequency: frequency,
                        stimulus: stimulus,
                        ear: ear,
                        conduction: newConduction,
                        masked: masking,
                        response: response,
                        width: width,
                        height: height
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

        // Push the new mark
        markList.push(newMark);
    }

    function pushCursorMark(frequency, stimulus) {
        var top = (parseInt(graphAxis.yAxis[stimulus].split('p')[0])) + 'px';
        var left = (parseInt(graphAxis.xAxis[frequency].split('p')[0])) + 'px';
        var mark = marks.CURSOR;
        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        height: 15,
                        width: 15
                      };
        markList.push(newMark);
    }

    function popMark() {
        return markList.pop();
    }

    // ClearMarks clears the canvas objects, lines drawn, and symbols
    function clearMarks() {
        markList.length = 0;
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.beginPath();
        ctx.closePath();
        markJ = [{
          "lm": [{}],
          "lu": [{}],
          "rm": [{}],
          "ru": [{}]
        }];
    }

    // Draw path takes a JSON mark list and computes the line between elements, draws the line and handles color
    function drawPath(marks){
      // Offset used for where the line meets the symbol
      var offset = 15;
      // Clears Rect in-between drawings of the lines, clears out the old lines
      ctx.clearRect(0,0,700,700);
      // Initializing the stroke value
      let color = black;

      // This code iterate through the JSON data structure
      Object.keys(marks[0]).forEach(function(key) {
        ctx.beginPath();
        color = key[0] === 'l' ? blue : red;
        ctx.strokeStyle = color;
        ctx.lineWidth=4;
        prvX = null;
        prvY = null;
        Object.keys(marks[0][key][0]).forEach(function(mark) {
          let x = marks[0][key][0][mark].left;
          let y = marks[0][key][0][mark].top;
          if (prvX !== null) {
            let angleDeg = getXY(x, y, prvX, prvY);
            if (prvY < y) {
              var aX = prvX + Math.cos(angleDeg) * offset;
              var aY = prvY + Math.sin(angleDeg) * offset;

              var bX = x - Math.cos(angleDeg) * offset;
              var bY = y - Math.sin(angleDeg) * offset;
            } else {
              var aX = x - Math.cos(angleDeg) * offset;
              var aY = y - Math.sin(angleDeg) * offset;

              var bX = prvX + Math.cos(angleDeg) * offset;
              var bY = prvY + Math.sin(angleDeg) * offset;
            }
            ctx.moveTo(aX, aY);
            ctx.lineTo(bX, bY);

          }
          prvX = x;
          prvY = y;
          ctx.closePath();
          ctx.stroke();
        });
      });
    }

}

