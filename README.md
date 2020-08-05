# limiter
A Chrome extension that allows you to limit the amount of visits to a particular website for a period of time.

## Getting Started

### Installing
1. `git clone https://github.com/jeffreylaw/limiter.git`
2. Go to chrome://extensions/ on your Chrome browser.
3. Turn on Developer mode (top right).
4. Click Load unpacked and select the Limiter folder.

The extension will now be available in your browser.

## Built With
* HTML
* CSS
* JavaScript
* Chrome API

## Upcoming Features
None at this time.

## Known Bugs
Icon badges won't clear by countdown if user never tries to visit domain after running out of visits. 

## Versions
3.2 - Now handles SPA changes, fixed a bug where pages triggered DOMContent and HistoryStateChange.\
3.1 - Popup style overhaul, minor style changes on injecting page, fixed clear all button.\
3.0 - Icons, colored badges, tabs that have a Limiter will show correct remaining number of visits left, blocked pages will reload once timer is done, disabled form on non-url pages, removed clear all button for now, general bug fixes.\
2.0 - Support for badges text, about & help pages, the ability to release websites\
1.5 - Removable limits, timer bug fixes\
1.0 - Initial Release

## Credits
Icon images by https://www.flaticon.com/authors/freepik
