/**
 * Created by r3d on 3/12/17.
 */

var csv = require('ya-csv');
var fs = require('fs');
var homeOrTmp = require('home-or-tmp');
var chalk = require('chalk');
var Table = require('cli-table');

var DATA_FILE = homeOrTmp+'/worker.csv';

module.exports = {

    dayStats: function () {
        var todayEvents = getTodayEvents();
        var timeStart, timeEnd;

        var totalDayTime;

        todayEvents.forEach(function (event) {
            if (event.event === 'start') {
                timeStart = event.time;
            } else if (event.event === 'end') {
                timeEnd = event.time;
            }
        });

        var diff = timeEnd - timeStart;
        var difference = new Date(diff);
        var diff_hours = difference.getHours();
        var diff_mins = difference.getMinutes();

        totalDayTime = diff_hours + ':' + diff_mins;

        var breakTime = totalBreakTime(todayEvents);

        var workTime = new Date(difference - breakTime * 60000);
        var work_hours = workTime.getHours();
        var work_mins = workTime.getMinutes();
        var totalWorkTime = work_hours + ':' + work_mins;

        var table = new Table({
            head: [(new Date()).toDateString(), '']
        });

        table.push(
            {'Total day': totalDayTime}
            , {'Break': breakTime + ' min'}
            , {'Work': totalWorkTime}
        );

        console.log(table.toString());
    },

    /**
     *
     * @param message
     * @param time
     */
    positiveMessage: function (message, time) {
        console.log(
            chalk.green(
                message + ' @ ' +
                chalk.underline(time.getHours() + ':' + time.getMinutes())
            ));
    },

    /**
     *
     */
    timeFormatError: function () {
        var error = chalk.bold.red;
        console.log(error('Error in time format [HH:MM]'));
    },

    /**
     *
     * @returns {boolean}
     */
    checkStartConditions: function () {
        var todayEvents = getTodayEvents();
        return todayEvents.length <= 0;
    },

    /**
     *
     * @returns {boolean}
     */
    checkEndConditions: function () {
        var todayEvents = getTodayEvents();
        var isStarted = false;

        todayEvents.forEach(function (event) {
            if (event.event === 'start') {
                isStarted = true;
            }
        });

        return isStarted;
    },

    /**
     *
     * @returns {boolean}
     */
    checkBreakStartConditions: function () {
        var todayEvents = getTodayEvents();
        var isStarted = false;
        var isEnded = false;

        var lastEvent = todayEvents[todayEvents.length - 1];
        if (lastEvent.event === 'break-start') {
            return false;
        }

        todayEvents.forEach(function (event) {
            if (event.event === 'start') {
                isStarted = true;
            }

            if (event.event === 'end') {
                isEnded = true;
            }
        });

        return (isStarted && !isEnded);
    },

    /**
     *
     * @returns {boolean}
     */
    checkBreakEndConditions: function () {
        var todayEvents = getTodayEvents();
        var lastEvent = todayEvents[todayEvents.length - 1];
        return lastEvent.event === 'break-start';
    },

    /**
     *
     * @param eventName
     * @param time
     */
    saveRecord: function (eventName, time) {

        var writer = csv.createCsvFileWriter(DATA_FILE, {'flags': 'a'});
        writer.writeRecord([eventName, time]);
    },

    /**
     *
     * @param timeParameter
     * @returns {*}
     */
    getTime: function (timeParameter) {

        var time;
        if (typeof timeParameter === 'string') {
            time = parseTime(timeParameter);
            if (!time) {
                return;
            }
        } else {
            time = new Date();
        }
        return time;
    }

};

/**
 *
 * @param timeInput
 * @returns {boolean}
 */
function checkTimeFormat(timeInput) {

    var regex = /^[0-9]{1,2}:[0-9]{2}$/g;
    var str = timeInput;
    var m;
    var retval = false;

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach(function (match, groupIndex) {
            retval = true;
        });
    }

    return retval;

}

/**
 *
 * @param timeInput
 * @returns {*}
 */
function parseTime(timeInput) {
    var isValidFormat = checkTimeFormat(timeInput);

    if (!isValidFormat) {
        return false;
    }

    // parse time
    var HH_MM = timeInput.split(':');

    var HH = parseInt(HH_MM[0]);
    var MM = parseInt(HH_MM[1]);

    if ((HH < 0 || HH > 24) || (MM < 0 || MM > 59)) {
        return false;
    }

    var today = new Date();
    today.setHours(HH);
    today.setMinutes(MM);

    return today;
}

/**
 *
 * @returns {Array}
 */
function getTodayEvents() {

    var today = new Date();
    var eventsToday = [];

    try {
        var contents = fs.readFileSync(DATA_FILE, {'flags': 'r'}).toString();

    } catch (err) {
        return [];
    }

    contents = contents.split('\r\n');
    contents.pop();

    contents.forEach(function (line) {
        var entry = line.split('","');
        entry[0] = entry[0].substr(1);
        entry[1] = entry[1].slice(0, -1);

        var event = entry[0];
        var time = new Date(entry[1]);

        // check if today
        if (time.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
            eventsToday.push({
                'event': event,
                'time': new Date(entry[1])
            })

        }
    });

    return eventsToday;

}

/**
 *
 * @param todayEvents
 */
function totalBreakTime(todayEvents) {
    var breakTimeInMinutes = 0;
    var startTime;
    for (var i = 0; i < todayEvents.length; i++) {
        if (todayEvents[i].event === 'break-start') {
            startTime = todayEvents[i].time;
        } else if (todayEvents[i].event === 'break-end') {
            var diff = todayEvents[i].time - startTime;
            var minutes = Math.floor((diff / 1000) / 60);
            breakTimeInMinutes += minutes;
            startTime = null;
        }
    }
    return breakTimeInMinutes;
}