# Interactive Mac Installer (alpha)

Got a new Mac? Install all your favorite apps and tools using this interactive script.

![Interactive Mac Installer screenshot](screenshot.png)

## Running

`cd` into the cloned directory, then:

```
chmod +x run.sh
./run.sh
```

Then follow the interactive prompts to choose which programs to install!

## Todos

* Make the tool actually install stuff and not do a dry run
* Use brew cask list to hide the apps you've already installed (to make this idempotent)
