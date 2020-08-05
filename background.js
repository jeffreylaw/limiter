/* ===================== Functions ===================== */

/* 
    Helper function to compare the latest time to the time last set.
*/
function notRunRecently(latestTime) {
    let diff = latestTime - chrome._LAST_RUN
    return diff < 500 ? false : true
}

/*
    Helper function, checks if the latest tab id is the different than the tab id last set.
*/
function isDifferentTab(otherTabId) {
    return chrome._LAST_TAB_ID !== otherTabId;
}

/*
    Clear leftover badges.
*/
function clearOldBadges(hostname) {
    chrome.storage.sync.get(null, function(items) {
        if (!items.hasOwnProperty(hostname)) {
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    let tabUrl = new URL(tab.url);
                    if (tabUrl.hostname === hostname) {
                        chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })  
                    }
                })
            })
        }
    })
}

/*
    Main processing function.
*/
function process(details) {
    let url = new URL(details.url);
    let hostname = url.hostname;
    let id = details.tabId;
    clearOldBadges(hostname);

    chrome.storage.sync.get(hostname, function(storage) {
        if (storage[hostname] && isAValidEntry(storage[hostname])) {
            let data = storage[hostname];
            let endTime = Date.parse(JSON.parse(data.endTime))
            let jsonData = JSON.stringify(data);

            if (endTime > new Date()) {
                incrementCount(data, hostname);
                updateBadgeText(data, hostname);
                if (exceededMaxCount(data)) {
                    injectOverlay(jsonData, hostname, id);         
                }
            } else {
                chrome.storage.sync.remove(hostname);
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(function(tab) {
                        let tabUrl = new URL(tab.url);
                        if (tabUrl.hostname === hostname) {
                            chrome.browserAction.setBadgeText({ text: "", tabId: tab.id });
                        }
                    })
                })
            }
        }
    })
}

/*
    Inject JS overlay.
*/
function injectOverlay(parsedData, hostname, id) {
    chrome.tabs.insertCSS(id, {file: "css/content.css"});
    chrome.tabs.executeScript(id, {
        code: "var dataObj = " + parsedData + "; var hostname = " + JSON.stringify(hostname)
        }, function() {
            chrome.tabs.executeScript(id, {file: "content.js"})
        });     
}

/*
    Update all badges of tabs with the same domain.
*/
function updateBadgeText(data, hostname) {
    let remainingCount = data["maxCount"] - (data["currentCount"] + 1);
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            let tabUrl = new URL(tab.url)
            if (tabUrl.hostname === hostname) {
                if (remainingCount < 0) {
                    chrome.browserAction.setBadgeBackgroundColor({ color: "#b30000", tabId: tab.id });
                    chrome.browserAction.setBadgeText({ text: 'X', tabId: tab.id });
                } else if (remainingCount === 0) {
                    chrome.browserAction.setBadgeBackgroundColor({ color: "#FFB319", tabId: tab.id });
                    chrome.browserAction.setBadgeText({ text: remainingCount.toString(), tabId: tab.id });
                } else {
                    chrome.browserAction.setBadgeBackgroundColor({ color: "#008000", tabId: tab.id });
                    chrome.browserAction.setBadgeText({ text: remainingCount.toString(), tabId: tab.id });
                }
            }
        })
    })
}

/*
    Check if the most recent attempt to access a website will exceed the maximum limit.
*/
function exceededMaxCount(data) {
    return (data["currentCount"] + 1) > data["maxCount"];
}

/*
    Increment the current visit count.
*/
function incrementCount(data, hostname) {
    let startTime = data["startTime"];
    let endTime = data["endTime"];
    let maxCount = data["maxCount"];
    let currentCount = data["currentCount"] + 1;
    let updatedData = {
        "startTime": startTime,
        "endTime": endTime,
        "maxCount": maxCount,
        "currentCount": currentCount
    }
    let jsonObj = {};
    jsonObj[hostname] = updatedData;
    chrome.storage.sync.set(jsonObj, function() {
        console.log('Updated', hostname, updatedData);
     });
}

/*
    Check if the object in the chrome storage is created by this extension.
*/
function isAValidEntry(obj) {
    return obj.hasOwnProperty("currentCount") && obj.hasOwnProperty("maxCount") && obj.hasOwnProperty("endTime") && obj.hasOwnProperty("startTime");
}

/*
    Update variables holding the timestamp of the event listener last ran and its origin tab id.
*/
function updateTrackingVariables(details) {
    chrome._LAST_RUN = details.timeStamp;
    chrome._LAST_TAB_ID = details.tabId;
}

/* ===================== Event Listeners ===================== */


/*
    Listen for DOM content being loaded.
*/
function callbackForDOMContentLoaded(details) {
    if (details.frameId === 0) {        
            console.log('Dom listener')
            updateTrackingVariables(details);
            process(details);
    }
}

/*
    Listen to history state changes.
*/
function callbackForHistoryStateUpdate(details) {
    if(details.frameId === 0) {
        if (typeof chrome._LAST_RUN === 'undefined' || notRunRecently(details.timeStamp)) {
            console.log('History listener')
            updateTrackingVariables(details);
            process(details);
        }

        if (!notRunRecently(details.timeStamp)) {
            if (isDifferentTab(details.tabId)) {
                console.log('Concurrent history listener')
                updateTrackingVariables(details);
                process(details);
            }
        }
    }
}

chrome.webNavigation.onDOMContentLoaded.addListener(callbackForDOMContentLoaded);
chrome.webNavigation.onHistoryStateUpdated.addListener(callbackForHistoryStateUpdate);

/*
    Listen for messages sent from extension.
*/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === 'setInitialBadges') {
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    let tabUrl = new URL(tab.url)
                    if (tabUrl.hostname === request.hostname) {
                        if (parseInt(request.maxVisits) === 0) {
                            chrome.browserAction.setBadgeBackgroundColor({ color: "#FFB319", tabId: tab.id });
                        } else {
                            chrome.browserAction.setBadgeBackgroundColor({ color: "#008000", tabId: tab.id });
                        }
                        chrome.browserAction.setBadgeText({ text: request.maxVisits, tabId: tab.id })
                    }
                })
            })
        }

        if (request.msg === 'clearOneDomain') {
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    let tabUrl = new URL(tab.url)
                    if (tabUrl.hostname === request.hostname) {
                        chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })
                        chrome.tabs.sendMessage(tab.id, {msg: "Are you there content script?"}, function (response) {
                            if (chrome.runtime.lastError) { return; }
                            response = response || {};
                            if (response.msg === 'Yes') {
                                chrome.tabs.reload(tab.id)
                            }
                        })
                    }
                })
            })
        }

        if (request.msg === 'clearAll') {
            let listOfDomains = [];
            chrome.storage.sync.get(null, function(items){
                for (key in items) {
                    if (isAValidEntry(items[key])) {
                        chrome.storage.sync.remove(key);
                        listOfDomains.push(key)
                    }
                }
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(function(tab) {
                        let tabUrl = new URL(tab.url)
                        if (listOfDomains.includes(tabUrl.hostname)) {
                            chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })
                            chrome.tabs.sendMessage(tab.id, {msg: "Are you there content script?"}, function (response) {
                                if (chrome.runtime.lastError) { return; }
                                response = response || {};
                                if (response.msg === 'Yes') {
                                    chrome.tabs.reload(tab.id)
                                }
                            })
                        }
                    })
                })
            })
        }
});