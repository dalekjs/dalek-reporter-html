/*!
 *
 * Copyright (c) 2013 Sebastian Golasch
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

'use strict';

// ext. libs
var Handlebars = require('handlebars');
var stylus = require('stylus');
var fs = require('fs');

var reporter = null;

/**
 * @module
 */

module.exports = function (opts) {
    if (reporter === null) reporter = new Reporter(opts);
    return reporter;
};

/**
 * @constructor
 */

function Reporter (opts) {
    this.events = opts.events;
    this.temporaryAssertions = [];
    this.loadTemplates();
    this.initOutputHandlers();
    this.startListening();
};

/**
 *
 */

Reporter.prototype.initOutputHandlers = function () {
    this.output = {};
    this.output.test = {};
};

/**
 *
 */

Reporter.prototype.loadTemplates = function () {
    // render stylesheets
    var precss = fs.readFileSync(__dirname + '/themes/default/styl/default.styl', 'utf8');
    stylus.render(precss, { filename: 'defualt.css' }, function(err, css){
      if (err) throw err;
      this.styles = css;
    }.bind(this));

    // collect client js (to be inined later)
    this.js = fs.readFileSync(__dirname + '/themes/default/js/default.js', 'utf8');;

    // register handlebars helpers
    Handlebars.registerHelper('roundNumber', function (number) {
      return Math.round(number * Math.pow(10, 2)) / Math.pow(10, 2);
    });

    // collect & compile templates
    this.templates = {};
    this.templates.test = Handlebars.compile(fs.readFileSync(__dirname + '/themes/default/hbs/test.hbs', 'utf8'));
    this.templates.wrapper = Handlebars.compile(fs.readFileSync(__dirname + '/themes/default/hbs/wrapper.hbs', 'utf8'));
    this.templates.testresult = Handlebars.compile(fs.readFileSync(__dirname + '/themes/default/hbs/tests.hbs', 'utf8'));
    this.templates.banner = Handlebars.compile(fs.readFileSync(__dirname + '/themes/default/hbs/banner.hbs', 'utf8'));
};

/**
 *
 */

Reporter.prototype.startListening = function () {
    this.events.on('report:assertion', this.outputAssertionResult.bind(this));
    this.events.on('report:assertion:status', this.outputAssertionExpecation.bind(this));
    this.events.on('report:test:finished', this.outputTestFinished.bind(this));
    this.events.on('report:test:started', this.outputTestStarted.bind(this));
    this.events.on('report:runner:started', this.outputRunnerStarted.bind(this));
    this.events.on('report:runner:finished', this.outputRunnerFinished.bind(this));
    this.events.on('report:run:browser', this.outputRunBrowser.bind(this));
};

/**
 *
 */

Reporter.prototype.outputRunBrowser = function (browser) {
    //console.log('outputRunBrowser', browser);
};

/**
 *
 */

Reporter.prototype.outputRunnerStarted = function (data) {
    //console.log('outputRunnerStarted', data);
};

/**
 *
 */

Reporter.prototype.outputRunnerFinished = function (data) {
    var body = '';
    var contents = '';
    var tests = '';
    var banner = '';

    // add test results
    var keys = Object.keys(this.output.test);
    keys.forEach(function (key) {
        tests += this.output.test[key];
    }.bind(this));

    // compile the test result template
    body = this.templates.testresult({result: data, tests: tests});

    // compile the banner
    banner = this.templates.banner({status: data.status});

    // compile the contents within the wrapper template
    contents = this.templates.wrapper({styles: this.styles, js: this.js, banner: banner, body: body});

    // save the main test output file
    fs.writeFileSync('report/dalek.html', contents, 'utf8');
};

/**
 *
 */

Reporter.prototype.outputAssertionResult = function (data) {
    this.temporaryAssertions.push(data);
    //console.log('outputAssertionResult', data);
};

/**
 *
 */

Reporter.prototype.outputAssertionExpecation = function (data) {
    //console.log('outputAssertionExpecation', data);
};

/**
 *
 */

Reporter.prototype.outputTestFinished = function (data) {
    data.assertionInfo = this.temporaryAssertions;
    this.output.test[data.id] = this.templates.test(data);
    this.temporaryAssertions = [];
};

/**
 *
 */

Reporter.prototype.outputAction = function (data) {
    //console.log('outputAction', data);
};

/**
 *
 */

Reporter.prototype.outputTestStarted = function (data) {
    //console.log('outputTestStarted', data);
};
