'use-strict';

angular
    .module('hearingTestApp.fileProcessor')
    .factory('fileProcessor', fileProcessor);

function fileProcessor($window, graphMarks, configConstants, domToImageFactory, cryptoLibraryFactory, simulatedListener) {
    var domToImage = domToImageFactory.getInstance();
    var cryptoLibrary = cryptoLibraryFactory.getInstance();
    var encryptionKey = "MagicResultKey";
    var frequencyOptions = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000];
    var MIN_STIMULUS = -10;
    var MAX_STIMULUS = 120;

    var processor = {};
    processor.exportResults = exportResults;
    processor.importResults = importResults;
    return processor;

    function exportResults(filename, type) {
        if (type === 'image') {
            exportToPNG(filename);
        } else if (type === 'csv' || type === 'encrypted') {
            exportDataPoints(filename, type);
        }
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
                    graphMarks.pushResultMark(m.frequency, m.stimulus, m.ear, m.conduction);
                }
                return true;
            }
            return false;
        }
    }

    function exportToPNG(filename) {
        domToImage.toPng(document.getElementById('graphArea'))
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

    function exportDataPoints(filename, type) {
        var text = convertMarksToString();
        var blob;
        if (type === 'csv') {
            blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        }
        if (type === 'encrypted') {
            var encryptedText = cryptoLibrary.encrypt(encryptionKey, text);
            blob = new Blob([encryptedText], { type: 'text/plain;charset=utf-8;' });
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

    function convertMarksToString() {
        var markList = graphMarks.getMarks().slice(0);
        var result = 'Frequency,Stimulus,Ear,Conduction\n';
        for (var i = 0; i < markList.length; i++) {
            var m = markList[i];
            var currentEar, currentConduction;
            if (m.ear === configConstants.LEFT_EAR) currentEar = 'left';
            else currentEar = 'right';
            if (m.conduction === configConstants.AC) currentConduction = 'AC';
            else currentConduction = 'BC';
            result = result +
                     m.frequency + ',' +
                     m.stimulus + ',' +
                     currentEar + ',' +
                     currentConduction + '\n';
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
                conduction = parseConduction(row[3]);
            if (frequency !== false && stimulus !== false && ear !== false && conduction !== false) {
                markList.push({frequency:frequency,stimulus:stimulus,ear:ear,conduction:conduction});
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

}
