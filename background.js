/* ===================== Functions ===================== */

function listen(hostname, id) {
    chrome.storage.sync.get(null, function(items){
        if (!items.hasOwnProperty(hostname)) {
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(function(tab) {
                    let tabUrl = new URL(tab.url)
                    if (tabUrl.hostname === hostname) {
                        chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })
                    }
                })
            })
        }
        for (key in items) {
            if (key === hostname) {
                let data = items[hostname];
                let retrievedEndTime = Date.parse(JSON.parse(data.endTime))
                let parsedData = JSON.stringify(items[hostname]);

                if (retrievedEndTime > new Date()) {
                    updateBadgeText(data, hostname);
                    incrementCount(hostname, data);
                    tryInjectingOverlay(data, parsedData, hostname, id);
                } else {
                    chrome.storage.sync.remove(hostname);
                    chrome.tabs.query({}, function(tabs) {
                        tabs.forEach(function(tab) {
                            let tabUrl = new URL(tab.url)
                            if (tabUrl.hostname === hostname) {
                                chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })
                            }
                        })
                    })
                }
            }
        }
    })
}

/*
    Try injecting JS overlay.
*/
function tryInjectingOverlay(data, parsedData, hostname, id) {
    if (exceededMaxCount(data)) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                if (tab.id === id) {
                    chrome.tabs.insertCSS(tab.id, {file: "css/content.css"});
                    chrome.tabs.executeScript(tab.id, {
                        code: "var dataObj = " + parsedData + "; var hostname = " + JSON.stringify(hostname)
                      }, function() {
                          chrome.tabs.executeScript(tab.id, {file: "content.js"})
                          chrome.browserAction.setBadgeBackgroundColor({ color: "#b30000", tabId: tab.id });
                          chrome.browserAction.setBadgeText({ text: "X", tabId: tab.id });
                      });       
                }
            })
        })   
    }
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
    if (data["currentCount"] + 1 > data["maxCount"]) {
        return true;
    } 
    return false;
}

/*
    Increment the current visit count.
*/
function incrementCount(hostname, data) {
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

function isAValidEntry(obj) {

}

/* ===================== Event Listeners ===================== */

/*
    Listen for website DOM being loaded.
*/
chrome.webNavigation.onDOMContentLoaded.addListener(function(e) {
    if (e.frameId == 0) {
        let url = new URL(e.url)
        listen(url.hostname, e.tabId)
    }
});

/*
    Check for messages sent from extension.
*/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
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

        if (request.msg === 'clearAll') {
            chrome.storage.sync.get(null, function(items){
                for (key in items) {
                    if (isAValidEntry(items[key])) {
                        chrome.storage.sync.remove(key);
                    }
                }
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(function(tab) {
                        chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })
                    })
                })
            })
        }
});
