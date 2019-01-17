'use-strict';

angular
  .module('hearingTestApp.fileProcessor')
  .factory('fileProcessor', fileProcessor);

function fileProcessor($window, graphMarks, maskerMarks, configConstants, domToImageFactory, cryptoLibraryFactory, simulatedListener) {
  var domToImage = domToImageFactory.getInstance();
  var cryptoLibrary = cryptoLibraryFactory.getInstance();
  var encryptionKey = "MagicResultKey";
  var frequencyOptions = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000];
  var MIN_STIMULUS = -10;
  var MAX_STIMULUS = 120;

  var processor = {};
  processor.exportResults = exportResults;
  processor.importResults = importResults;
  processor.exportAll = exportAll;
  return processor;

  function exportResults(filename, type) {
    if (type === 'image') {
      exportToPNG(filename + 'png');
    } else if (type === 'csv' || type === 'encrypted') {
      exportDataPoints(filename, type);
    }
  }

  function exportAll(filename) {
    exportToPNG(filename);
    exportDataPoints(filename, 'csv');
    exportDataPoints(filename, 'encrypted');
  }

  function importResults(givenData, type) {
    if (type === 'encrypted') {
      try {
        var markList = parseData(cryptoLibrary.decrypt(encryptionKey, givenData));
        if (markList !== false) {
          simulatedListener.setPatientData(markList);
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    } else {
      var markList = parseData(givenData);
      if (markList !== false) {
        // clearing the marks and masks
        graphMarks.clearMarks();
        maskerMarks.clearMasks();

        for (var i = 0; i < markList.length; i++) {
          var m = markList[i];
          graphMarks.pushResultMark(m.frequency, m.stimulus, m.ear, m.conduction, m.masked, m.response, m.masking);
        }

        return true;
      }
      return false;
    }
  }

  function exportToPNG(filename) {
    domToImage.toPng(document.getElementById('graphArea'))
      .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function exportDataPoints(filename, type) {
    var text = convertMarksToString(type);

    var blob;
    if (type === 'csv') {
      blob = new Blob([text], {type: 'text/csv;charset=utf-8;'});
      filename = filename + '.csv';
    }
    if (type === 'encrypted') {
      var encryptedText = cryptoLibrary.encrypt(encryptionKey, text);
      blob = new Blob([encryptedText], {type: 'text/plain;charset=utf-8;'});
      filename = filename + '.txt';
    }
    var link = document.createElement("a");
    if (link.download !== undefined) {
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Updates to fix the exporting of no-response values for the mark list refer to Issue 2 & 3 - Feb 2018
  function convertMarksToString(type) {
    // init the result and data lists
    var markList = graphMarks.getMarks().slice(0),
        maskerList = maskerMarks.getMasks().slice(0),
        result;

    // respective table attributes
    if (type === 'csv') {
      result = 'Frequency,Stimulus,Ear,Conduction,Masked,Mask Level,Response\n';
    } else if (type === 'encrypted') {
      result = 'Frequency,Stimulus,Ear,Conduction,Masked,Mask Level\n';
    }

    // adding each row into the result
    // note:
    //      maskerMarks.service.js includes a way to grab the mask level set by the control panel,
    //      however there is an issue with the way it is programmed. the service pushes individual
    //      masking objects onto a list that doesn't account for the overall position of current mark
    //      being drawn. as a quick fix to this issue, i hold the position of the masking list so i
    //      don't need to rewrite the maskerMarks.service.js logic.
    var maskIterator = 0;
    for (var i = 0; i < markList.length; i++) {
      var currMark = markList[i];
      var currEar,
          currConduction,
          currResponse = currMark.response,
          currMasked = currMark.masked,
          currMaskVal = 0;

      // if mask exists, change grab and set value.
      if (currMasked === 1){
        currMaskVal = maskerList[maskIterator].value;
        maskIterator++;
      }

      // ears and conduction
      (currMark.ear === configConstants.LEFT_EAR) ? currEar = 'left' : currEar = 'right';
      (currMark.conduction === configConstants.AC) ? currConduction = 'AC' : currConduction = 'BC';

      // final str build
      if (type === 'csv') {
        result = result +
          currMark.frequency + ',' + currMark.stimulus + ',' + currEar + ',' + currConduction + ',' + currMasked + ',' +
          currMaskVal + ',' + currResponse + '\n';
      } else if (type === 'encrypted' && currResponse === configConstants.RESPONSE) {
        result = result +
          currMark.frequency + ',' + currMark.stimulus + ',' + currEar + ',' + currConduction + ',' + currMasked + ',' +
          currMaskVal + '\n';
      }
    }

    return result;
  }

  function parseData(textData) {
    var rows = textData.split('\n');
    rows.length = rows.length - 1; // ignore last empty line
    if (rows.length <= 1) {
      // first row is just column names
      $window.alert('File cannot be imported, data is not formatted correctly.');
      return false;
    }
    var markList = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i].split(',');
      var frequency = parseFrequency(row[0]);
      var stimulus = parseStimulus(row[1]);
      var ear = parseEar(row[2]);
      var conduction = parseConduction(row[3]);

      // mask boolean is row 4, mask level is 5
      var masking = parseMasking([row[4],row[5]]);

      var response = parseResponse(row[6]);
      // If the response value doesn't exist we assume they are all responses
      if (response === false) {
        response = configConstants.RESPONSE;
      }
      if (frequency !== false && stimulus !== false && ear !== false && conduction !== false && masking !== false && response !== false) {
        markList.push({
          frequency: frequency,
          stimulus: stimulus,
          ear: ear,
          conduction: conduction,
          masked: masking[0],
          masking: masking[1],
          response: response
        });
      } else {
        $window.alert('File cannot be imported, data is not formatted correctly.');
        return false;
      }
    }
    return markList;
  }

  function parseFrequency(f) {
    var result = parseInt(f);
    if (frequencyOptions.indexOf(result) < 0) return false;
    else return result;
  }

  function parseStimulus(s) {
    var result = parseInt(s);
    if (result < MIN_STIMULUS || result > MAX_STIMULUS || result % 5 !== 0) return false;
    else return result;
  }

  function parseEar(e) {
    if (e === 'left') return configConstants.LEFT_EAR;
    if (e === 'right') return configConstants.RIGHT_EAR;
    return false;
  }

  function parseConduction(c) {
    if (c === 'AC') return configConstants.AC;
    if (c === 'BC') return configConstants.BC;
    return false;
  }

  // takes in both the mask bool and the possible mask value
  function parseMasking(m) {
    var mask_state = m[0];
    var mask_value = m[1];

    // case of no masking on given mark
    if (mask_state === "0"){
      return [configConstants.NO_MASKING, configConstants.NO_MASKING];
    }

    // case of present masking on given mark
    if (mask_state === "1"){
      return [configConstants.MASKING, mask_value];
    }

    // emergency exit
    return false;
  }

  function parseResponse(r) {
    if (r === "1") return configConstants.RESPONSE;
    if (r === "0") return configConstants.NO_RESPONSE;
    return false;
  }

}
