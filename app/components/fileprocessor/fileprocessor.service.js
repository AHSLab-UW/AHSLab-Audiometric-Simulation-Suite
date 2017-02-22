'use-strict';

angular
    .module('hearingTestApp.fileProcessor')
    .factory('fileProcessor', fileProcessor);

function fileProcessor($window, graphMarks, configConstants) {
    var frequencyOptions = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000];
    var MIN_STIMULUS = -10;
    var MAX_STIMULUS = 120;

    var processor = {};
    processor.exportToCSV = exportToCSV;
    processor.exportToPNG = exportToPNG;
    processor.importCSV = importCSV;
    return processor;

    function exportToCSV(filename) {
        var rows = convertMarksTo2dArray();
        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += convertRowToString(rows[i]);
        }
        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
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

    function exportToPNG(filename) {
        // using dom-to-image library which provides global variable domtoimage
        domtoimage.toPng(document.getElementById('graphArea'))
            .then(function(dataUrl) {
                var link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
            })
            .catch(function(error) {
                console.error(error);
            });
    }

    function importCSV(textData) {
        var rows = textData.split('\n');
        rows.length = rows.length - 1; // ignore last empty line
        if (rows.length <= 1) {
            $window.alert('File cannot be imported, data is not formatted correctly.');
            return false;
        }
        var markList = [];
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i].split(',');
            var frequency = parseFrequency(row[0]),
                stimulus = parseStimulus(row[1]),
                ear = parseEar(row[2]),
                conduction = parseConduction(row[3]);
            if (frequency !== false && stimulus !== false && ear !== false && conduction !== false) {
                markList.push({frequency:frequency,stimulus:stimulus,ear:ear,conduction:conduction});
            } else {
                $window.alert('File cannot be imported, data is not formatted correctly.');
                return false;
            }
        }
        graphMarks.clearMarks();
        for (var i = 0; i < markList.length; i++) {
            var m = markList[i];
            graphMarks.pushResultMark(m.frequency, m.stimulus, m.ear, m.conduction);
        }
        return true;
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

    function convertMarksTo2dArray() {
        var markList = graphMarks.getMarks().slice(0);
        var result = [['Frequency', 'Stimulus', 'Ear', 'Conduction']];
        for (var i = 0; i < markList.length; i++) {
            var m = markList[i];
            var currentEar, currentConduction;
            if (m.ear === configConstants.LEFT_EAR) currentEar = 'left';
            else currentEar = 'right';
            if (m.conduction === configConstants.AC) currentConduction = 'AC';
            else currentConduction = 'BC';
            result.push([m.frequency, m.stimulus, currentEar, currentConduction]);
        }
        return result;
    }

    function convertRowToString(row) {
        var finalVal = '';
        for (var i = 0; i < row.length; i++) {
            var innerValue = row[i] === null ? '' : row[i].toString();
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0) {
                result = '"' + result + '"';
            }
            if (i > 0) {
                finalVal += ',';
            }
            finalVal += result;
        }
        return finalVal + '\n';
    }

}
