# bootstraps the system with the necessary tools to run the app installation script

# install homebrew and cask
brew --version > /dev/null
if [ $? -ne 0 ]; then
    echo "Installing Homebrew"
    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi

brew cask --version > /dev/null
if [ $? -ne 0 ]; then
    echo "Installing Cask"
    brew install caskroom/cask/brew-cask
fi

# prepare node for the app installation script
node --version > /dev/null
if [ $? -ne 0 ]; then
    echo "Installing Node.js"
    brew install node
fi
npm install

# run the app installation script
node app.js
