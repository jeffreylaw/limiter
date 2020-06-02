/* ===================== Functions ===================== */

function listen(hostname, id) {
    chrome.storage.sync.get(null, function(items){
        for (key in items) {
            if (hostname === key) {
                let data = items[hostname];
                let parsedData = JSON.stringify(items[hostname]);
                updateBadgeText(data, id);
                incrementCount(hostname, data);
                injectOverlay(data, parsedData, hostname, id);
            }
        }
    })
}

function injectOverlay(data, parsedData, hostname, id) {
    setTimeout(function() {
        if (exceededMaxCount(data)) {
            chrome.tabs.insertCSS({file:"css/content.css"});
            chrome.tabs.executeScript({
                code: 'var dataObj = ' + parsedData + '; var hostname = ' + JSON.stringify(hostname)
              }, function() {
                  chrome.tabs.executeScript(null, {file: 'content.js'})
                  chrome.browserAction.setBadgeText( { text: "", tabId: id });
              });
        }
    }, 1);
}

function updateBadgeText(data, id) {
    let remainingCount = Math.max(0, data["maxCount"] - (data["currentCount"] + 1));
    chrome.browserAction.setBadgeText( { text: remainingCount.toString(), tabId: id });
}

// function rotateBadge(hostname, id) {
//     chrome.storage.sync.get(null, function(items){
//         let found = false;
//         for (key in items) {
//             if (hostname === key) {
//                 let data = items[hostname];
//                 data["currentCount"] -= 1;
//                 updateBadgeText(data);
//                 found = true;
//             }
//         }
//         if (!found) {
//             chrome.browserAction.setBadgeText({ text: "", tabId: id });
//         }
//     })
// }

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
    var jsonObj = {};
    jsonObj[hostname] = updatedData;
    chrome.storage.sync.set(jsonObj, function() {
        console.log('Updated', hostname, updatedData);
     });
}

/* ===================== Event Listeners ===================== */

/*
    Listen for website loaded.
*/
chrome.webNavigation.onCompleted.addListener(function(e) {
    if (e.frameId == 0) {
        chrome.tabs.query({'active': true, currentWindow: true},
        function(tabs) {
            var url = new URL(tabs[0].url);
            let currentHostName = url.hostname;   
    
            listen(currentHostName, tabs[0].id);
        })
    }
});


// chrome.tabs.onActivated.addListener(function(e) {
//     chrome.tabs.query({'active': true, currentWindow: true},
//     function(tabs) {
//         var url = new URL(tabs[0].url);
//         let currentHostName = url.hostname;   

//         rotateBadge(currentHostName, tabs[0].id);
//     })
// })