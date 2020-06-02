let counters = document.getElementById("counters")
let addSite = document.getElementById("addSite");
let clearBtn = document.getElementById("clearLimiter");
let clearAllBtn = document.getElementById("clearAll");
let maxVisits = document.getElementById("maxVisits");
let hours = document.getElementById("hours");
let minutes = document.getElementById("minutes");
let hostname = document.getElementById("hostname");
let endTime;

/* ===================== Functions ===================== */

/*
   Set hostname values 
*/
function setHostname() {
   chrome.tabs.query({'active': true, currentWindow: true},
      function(tabs){
         var url = new URL(tabs[0].url);
         let key = url.hostname;
         hostname.innerHTML = key;
         document.getElementById("clearLimiter").value = "Release " + key;
   });
}

/*
   Check if the current Chrome tab website is limited and show timer components if it is.
*/
function start() {
   document.getElementById("counters").style.display = "none";
   chrome.tabs.query({'active': true, currentWindow: true},
      function(tabs){
         var url = new URL(tabs[0].url);
         let hostname = url.hostname;
         chrome.storage.sync.get(null, function(items){
            for (key in items) {
                if (hostname === key) {
                  counters.style.display = "block";
                    console.log(items[hostname]);
                    endTime = new Date(JSON.parse(items[hostname]["endTime"])).getTime();
                    displayTimer();
                    displayRemainingCounter(items[hostname]);
                }
            }
        })

   });
}

/*
   Create and display countdown timer.
*/
function displayTimer() {
   var interval = setInterval(function() {
      var now = new Date().getTime();
      var distance = endTime - now;
   
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      document.getElementById("timer").innerHTML = "Blocked for: " + hours + "h " + minutes + "m " + seconds + "s ";
      if (hours == 0 && minutes == 0 && seconds == 0) {
          clearInterval(interval);
          document.getElementById("timer").innerHTML = "Unblocked!"
      }
   });
}

/*
   Create and display the visits remaining.
*/
function displayRemainingCounter(data) {
   let remaining = Math.max(0, data["maxCount"] - data["currentCount"]);
   document.getElementById("remainingCounter").innerHTML = "Visits left: " + remaining;
}

/*
   Set href links for the about and how to use pages.
*/
function setLinks() {
   document.getElementById("about-link").href = chrome.runtime.getURL('about.html');
   document.getElementById("howto-link").href = chrome.runtime.getURL('howto.html')
}

/* ===================== Event Listeners ===================== */

/*
   <Limit> button
   Checks if the form values are valid, then adds the data into the Chrome storage.
*/
addSite.onclick = function() {
   if (maxVisits.checkValidity() && hours.checkValidity() && minutes.checkValidity()) {
      chrome.tabs.query({'active': true, currentWindow: true},
     function(tabs){
        var url = new URL(tabs[0].url);
        let key = url.hostname;
        let currentTime = new Date();
        let expiryTime = new Date(currentTime);
        if (hours.value != null && hours.value != "" && hours.value > 0) {
           expiryTime.setHours(currentTime.getHours() + parseInt(hours.value))
        } else {
           expiryTime.setHours(currentTime.getHours() + 0);
        }
        if (minutes.value != null && hours.value != "" && minutes.value > 0) {
           expiryTime.setMinutes(currentTime.getMinutes() + parseInt(minutes.value));
        } else {
           expiryTime.setMinutes(currentTime.getMinutes() + 0);
        }
  
        currentTime = JSON.stringify(currentTime);
        expiryTime = JSON.stringify(expiryTime);

        let data = {
           "startTime": currentTime,
           "endTime": expiryTime,
           "currentCount": 0,
           "maxCount": parseInt(maxVisits.value)
        }
        var jsonObj = {};
        jsonObj[key] = data
        chrome.storage.sync.set(jsonObj, function() {
           console.log('Saved', key, data);
        });
        chrome.browserAction.setBadgeText({ text: maxVisits.value, tabId: tabs[0].id });
        window.close();
     });
   }
}

/*
   <Release website> button
   Removes the website entry from the Chrome storage and refreshes the page.
*/
clearBtn.onclick = function() {
   chrome.tabs.query({'active': true, currentWindow: true},
   function(tabs){
      var url = new URL(tabs[0].url);
      let hostname = url.hostname;
      chrome.storage.sync.remove(hostname);
      chrome.browserAction.setBadgeText({ text: "", tabId: tabs.id });
      window.close();
      chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
   });
}

/*
   <Release all sites> button
   Clears the Chrome storage and refreshes the page.
*/
clearAllBtn.onclick = function() {
   chrome.tabs.query({'active': true, currentWindow: true},
   function(tabs){
      chrome.storage.sync.clear();
      window.close();
      chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
   });
}


/* ===================== Initialization ===================== */

setHostname();
start();
setLinks();
