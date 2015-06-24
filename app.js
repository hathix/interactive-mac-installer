/*
    Runs the interactive app installer.

    node app.js: actually installs the apps
    node app.js --dev: does a dry-run without installing any apps (much faster and less annoying to test)
*/

var child_process = require('child_process');
var _ = require('underscore');
var chalk = require('chalk');
var inquirer = require('inquirer');
var argv = require('minimist')(process.argv.slice(2));

var apps = require('./apps');

// constants set by command-line arguments
var DEVELOPMENT = false;
if (argv.dev === true) {
    DEVELOPMENT = true;
}

// Executes the given shell command and returns a Promise that resolves
// to its standard output.
function exec(command){
    return new Promise(function(resolve, reject){
        child_process.exec(command, function(error, stdout, stderr){
            if (error === null) {
                resolve(stdout);
            }
            else {
                reject(error);
            }
        });
    });
}

// Returns a promise that resolves to the chosen inquirer results.
function inquire(questions){
    return new Promise(function(resolve, reject){
        inquirer.prompt(questions, function(answers){
            resolve(answers);
        });
    });
}

// Given an array of Promise thunks, returns a thunk that executes all of them
// in order and returns their outputs in an array (in that same order
Promise.chain = function(thunks){
    return function(){
        // TODO clean up this logic because it's nasty; make more functional
        var outs = [];
        var chained = _.reduce(thunks, function(memo, item){
            return memo.then(function(out){
                outs.push(out);
                return item();
            });
        }, Promise.resolve());
        var cleanup = chained.then(function(out){
            outs.push(out);
            return _.tail(outs);
        });
        return cleanup;
    }
}

// returns a promise that
// runs `missingCommand` to install something if `testCommand` returns an error.
// e.g. to install foo if it doesn't exist, use testCommand='foo --version' and
// missingCommand='install foo'
function maybeInstall(testCommand, installedMessage, missingMessage, missingCommand) {
    return new Promise(function(resolve, reject){
        exec(testCommand).then(function(){
            console.log(chalk.green(installedMessage));
            resolve();
        }).catch(function(){
            // homebrew not installed
            console.log(chalk.red(missingMessage));
            exec(missingCommand).then(function(){
                resolve();
            });
        });
    });
}

// returns a promise that
// runs the given message and offers options to install the apps mentioned
// in choices, ultimately returning the names of the apps to be installed.
function installApps(message, choices){
    return inquire({
        type: "checkbox",
        name: "apps",
        message: message,
        choices: choices
    }).then(function(answers){
        // don't install all the apps now, just return their names
        // so we can install them all at the end
        return answers.apps;
    });
}

function main(){
    console.log(chalk.inverse("🍎  Pick some apps to install! 🍎 "));

    // apps contains information to run an installer for a particular
    // category of app; generate a thunk that wraps that installer
    var appInstallers = _.map(apps, function(category){
        var choices = _.sortBy(category.choices, function(choice){
            return choice.name;
        });
        return function(){
            return installApps(category.message, choices);
        }
    });
    var appChain = Promise.chain(appInstallers);
    appChain().then(function(chosenApps){
        // now install all chosen apps
        var flatAppList = _.flatten(chosenApps);
        console.log(chalk.inverse("🎁  Installing " + flatAppList.length + " apps! This might take a while... 🎁 "));

        var installPromises = _.map(flatAppList, function(app){
            var command = DEVELOPMENT ? "brew cask info " : "brew cask install ";
            return exec(command + app).then(function(){
                console.log(chalk.blue("Installed " + app));
            });
        });
        return Promise.all(installPromises);
    }).then(function(){
        console.log(chalk.inverse("🎉  Done! Enjoy your Mac! 🎉 "));
    }).catch(function(error){
        console.log(error);
    });
}

main();

// TODO make commands responsible for printing to stdout using console.log(chalk.dim)
/* change to this

            exec(missingCommand).then(function(stdout){
                console.log(stdout);
                resolve();
            });

*/
// TODO handle errors properly

/* Stuff to install

    brew installs

    languages
        node
        ruby
        python
        python3

    tools
        git
        duck
        ack
        ag
        imagemagick
        pandoc

    ---

    npm installs

    bower
    yeoman
    grunt
    gulp
*/
