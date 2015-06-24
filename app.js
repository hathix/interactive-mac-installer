var process = require('child_process');
var _ = require('underscore');
var chalk = require('chalk');
var inquirer = require('inquirer');

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
            return exec("brew cask info " + c).then(function(){
                console.log(chalk.blue("Installing " + c));
            });
        });
        return Promise.all(promises);
    });
}

function main(){
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

    function installBrowsers() {
        return installApps("Pick a web browser!", [
            {
                name: "Opera",
                value: "opera"
            },
            {
                name: "Chrome",
                value: "google-chrome"
            }
        ]);
    }

    function installEditors() {
        return installApps("Pick a text editor!", [
            {
                name: "Atom",
                value: "atom"
            },
            {
                name: "Brackets",
                value: "brackets"
            },
            {
                name: "Vim",
                value: "macvim"
            }
        ]);
    }

    var promiseChain = [
        installHomebrew,
        installCask,
        installBrowsers,
        installEditors,
    ];
    var chained = Promise.chain(promiseChain);
    chained().then(function(){
        console.log(chalk.underline("Done! Enjoy your Mac!"));
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
