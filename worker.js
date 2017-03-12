#!/usr/bin/env node

/**
 * Created by r3d on 3/12/17.
 */

var program = require('commander');
var chalk = require('chalk');
var util = require('./util');
var figlet = require('figlet');

var error = chalk.bold.red;


program
    .version('0.0.1')
    .option('-s, --start [time]', 'Start day')
    .option('-e, --end [time]', 'End day')
    .option('-B, --break-start [time]', 'Start break')
    .option('-b, --break-end [time]', 'End break')
    .parse(process.argv);


/**
 * Start day
 */
if (program.start) {
    var time = util.getTime(program.start);
    if (!time) {
        util.timeFormatError();
        return;
    }

    if (!util.checkStartConditions()) {
        console.log(error('Error: You already started your day'));
        return;
    }

    util.saveRecord('start', time.toISOString());
    util.positiveMessage('Started working', time);
    return;
}

/**
 * End day
 */
if (program.end) {
    var time = util.getTime(program.end);
    if (!time) {
        util.timeFormatError();
        return;
    }

    if (!util.checkEndConditions()) {
        console.log(error('Error: You didn\'t start your day'));
        return;
    }

    util.saveRecord('end', time.toISOString());
    util.positiveMessage('Finished working', time);

    figlet('See You Space Cowboy', function (err, data) {
        if (err)
            return;

        util.dayStats();
        console.log(data);
    });


    return;
}

/**
 * Start break
 */
if (program.breakStart) {
    var time = util.getTime(program.breakStart);
    if (!time) {
        util.timeFormatError();
        return;
    }

    if (!util.checkBreakStartConditions()) {
        console.log(error('Error: You can\'t start a break'));
        return;
    }

    util.saveRecord('break-start', time.toISOString());
    util.positiveMessage('Started break', time);
    return;
}

/**
 * End break
 */
if (program.breakEnd) {
    var time = util.getTime(program.breakEnd);
    if (!time) {
        util.timeFormatError();
        return;
    }

    if (!util.checkBreakEndConditions()) {
        console.log(error('Error: You can\'t end a break'));
        return;
    }

    util.saveRecord('break-end', time.toISOString());
    util.positiveMessage('Finished break', time);
    return;
}

