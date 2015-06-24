var process = require('child_process');
var _ = require('underscore');
var chalk = require('chalk');
var inquirer = require('inquirer');

var apps = require('./apps');

// contants
var DEVELOPMENT = true;

// Executes the given shell command and returns a Promise that resolves
// to its standard output.
function exec(command){
    return new Promise(function(resolve, reject){
        process.exec(command, function(error, stdout, stderr){
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
// in choices
function installApps(message, choices){
    return inquire({
        type: "checkbox",
        name: "apps",
        message: message,
        choices: choices
    }).then(function(answers){
        // install every cask referenced from inquirer
        // we can install all of these in parallel with Promise.all
        // because they don't depend on each other
        var promises = _.map(answers.apps, function(c){
            var command = DEVELOPMENT ? "brew cask info " : "brew cask install ";
            return exec(command + c).then(function(){
                console.log(chalk.blue("Installing " + c));
            });
        });
        return Promise.all(promises);
    });
}

function main(){
    console.log(chalk.inverse("🍎  Let's install some apps! 🍎 "));

    /*
    // install homebrew if it's not installed
    function installHomebrew() {
        return maybeInstall("brew --version", "Homebrew already installed!",
            "Installing Homebrew", 'ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"');
    }

    // install cask if it's not installed
    function installCask() {
        return maybeInstall("brew cask --version", "Cask already installed!", "Installing Cask",
            "brew install caskroom/cask/brew-cask");
    }
    */

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
    appChain().then(function(){
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

    brew cask installs

    browers
        firefox
        chromium
        google-chrome
        opera

    editors
        macvim
        atom
        brackets
        sublime-text
        textmate
        bbedit
        textwrangler
        emacs
        mou

    admin
        alfred
        quicksilver
        bettertouchtool
        caffeine
        flux

    productivity
        evernote
        todoist
        dropbox
        google-drive
        kindle

    media
        vlc
        vox
        banshee
        clementine
        handbrake

    mail
        mailbox
        thunderbird

    art
        gimp
        pinta
        musescore
        pixlr

    messaging
        skype
        google-hangouts
        slack
        hipchat

    developer
        netbeans
        eclipse-ide
        github
        java

    ---

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
