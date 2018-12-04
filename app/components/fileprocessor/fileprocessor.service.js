'use-strict';

angular
  .module('hearingTestApp.fileProcessor')
  .factory('fileProcessor', fileProcessor);

function fileProcessor($window, graphMarks, maskerMarks, configConstants, domToImageFactory, cryptoLibraryFactory, simulatedListener) {
  var domToImage = domToImageFactory.getInstance();
  var cryptoLibrary = cryptoLibraryFactory.getInstance();
  var encryptionKey = "MagicResultKey";
  var frequencyOptions = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]; // 125, 12000 removed per Dr. Shen request 02/01/2018
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
        graphMarks.clearMarks();
        for (var i = 0; i < markList.length; i++) {
          var m = markList[i];
          graphMarks.pushResultMark(m.frequency, m.stimulus, m.ear, m.conduction, m.masked, m.response);
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
    var markList = graphMarks.getMarks().slice(0);
    var result;
    if (type === 'csv') {
      result = 'Frequency,Stimulus,Ear,Conduction,Masked,Mask Level,Response\n';
    } else if (type === 'encrypted') {
      result = 'Frequency,Stimulus,Ear,Conduction,Masked,Mask Level\n';
    }
    for (var i = 0; i < markList.length; i++) {
      var m = markList[i];
      var currentEar, currentConduction;
      var masked = m.masked;

      // if a masking exists, we need to grab the masklist for the values
      var maskValue = 'nil';
      if (masked === 1) {
        var maskList = maskerMarks.getMasks().slice(0);
        maskValue = maskList[i].value;
      }

      var response = m.response;
      if (m.ear === configConstants.LEFT_EAR) currentEar = 'left';
      else currentEar = 'right';
      if (m.conduction === configConstants.AC) currentConduction = 'AC';
      else currentConduction = 'BC';
      if (type === 'csv') {
        result = result +
          m.frequency + ',' +
          m.stimulus + ',' +
          currentEar + ',' +
          currentConduction + ',' +
          masked + ',' +
          maskValue + ',' +
          response + '\n';
      } else if (type === 'encrypted' && response === configConstants.RESPONSE) {
        result = result +
          m.frequency + ',' +
          m.stimulus + ',' +
          currentEar + ',' +
          currentConduction + ',' +
          masked + ',' +
          maskValue + '\n';
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
      var frequency = parseFrequency(row[0]),
        stimulus = parseStimulus(row[1]),
        ear = parseEar(row[2]),
        conduction = parseConduction(row[3]),
        masking = parseMasking(row[4]),
        response = parseResponse(row[5]);
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
          masked: masking,
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

  function parseMasking(m) {
    if (m[0] === "1") return configConstants.MASKING;
    if (m[0] === "0") return configConstants.NO_MASKING;
    return false;
  }

  function parseResponse(r) {
    if (r === "1") return configConstants.RESPONSE;
    if (r === "0") return configConstants.NO_RESPONSE;
    return false;
  }

}
