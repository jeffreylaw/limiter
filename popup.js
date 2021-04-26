let counters = document.getElementById("counters");
let addSite = document.getElementById("addSite");
let clearBtn = document.getElementById("clearLimiter");
let clearAllBtn = document.getElementById("clearAll");
let maxVisits = document.getElementById("maxVisits");
let hours = document.getElementById("hours");
let minutes = document.getElementById("minutes");
let hostname = document.getElementById("hostname");
let infoDiv = document.getElementById("info-div");
let formDiv = document.getElementById("create-limit-div");
let releaseBtnsDiv = document.getElementById("release-buttons");
let endTime;

/* ===================== Functions ===================== */

/*
   Set hostname values.
*/
function setHostname() {
   chrome.tabs.query({'active': true, currentWindow: true},
      function(tabs){
         let url = new URL(tabs[0].url);
         hostname.innerHTML = url.hostname;
         document.getElementById("clearLimiter").value = "Unlimit " + url.hostname;
         if (!url.hostname.includes(".")) {
            formDiv.style.display = "none";
            hostname.innerHTML = "";
            counters.innerHTML = "";
            let infoPara = document.createElement("p");
            infoPara.appendChild(document.createTextNode("This page cannot be blocked."));
            counters.appendChild(infoPara);
            releaseBtnsDiv.style.display = "none";
         } else {
            document.getElementById("counters").style.display = "none";
         }
   });
}

/*
   Check if the current Chrome tab website is limited and show timer components if it is.
*/
function start() {
   chrome.tabs.query({'active': true, currentWindow: true},
      function(tabs){
         let url = new URL(tabs[0].url);
         chrome.storage.sync.get(null, function(items){
            for (key in items) {
               if (key === url.hostname) {
                  counters.style.display = "block";
                  console.log(items[url.hostname]);
                  endTime = new Date(JSON.parse(items[url.hostname]["endTime"])).getTime();
                  displayTimer(items[url.hostname]);
                  displayRemainingCounter(items[url.hostname]);
                  hideForm();
               }
            }
        })

   });
}

/*
   Hide form.
*/
function hideForm() {
   formDiv.style.display = "none";
}

/*
   Create and display countdown timer.
*/
function displayTimer(data) {
   let interval = setInterval(function() {
      let remaining = data["maxCount"] - data["currentCount"];

      let now = new Date().getTime();
      let distance = endTime - now;
      let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((distance % (1000 * 60)) / 1000);
      if (remaining < 0) {
         document.getElementById("timer").innerHTML = "Blocked until";
      } else {
         document.getElementById("timer").innerHTML = "Limit set until";
      }

      document.getElementById("timer").innerHTML += "<br><span class='counter'>" + hours + "h " + minutes + "m " + seconds + "s</span>";
      if (hours == 0 && minutes == 0 && seconds == 0 || seconds < 0) {
          clearInterval(interval);
          document.getElementById("timer").innerHTML = "Unblocked!";
      }
   });
}

/*
   Create and display the visits remaining.
*/
function displayRemainingCounter(data) {
   let remaining = data["maxCount"] - data["currentCount"];
   if (remaining < 0) {
      document.getElementById("remainingCounter").innerHTML = "You ran out of visits.";
   } else if (remaining === 0 ) {
      document.getElementById("remainingCounter").innerHTML = "Your next visit will be blocked.";
   } else {
      document.getElementById("remainingCounter").innerHTML = "<span>"+ remaining + " visits remaining</span>";
   }
}

/*
   Set href links for the about and how to use pages.
*/
function setLinks() {
   document.getElementById("about-link").href = chrome.runtime.getURL('about.html');
   document.getElementById("howto-link").href = chrome.runtime.getURL('howto.html');
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
        let url = new URL(tabs[0].url);
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
        let jsonObj = {};
        jsonObj[url.hostname] = data
        chrome.storage.sync.set(jsonObj, function() {
           console.log('Saved', url.hostname, data);
        });
        chrome.runtime.sendMessage({msg: "setInitialBadges", hostname: url.hostname, maxVisits: maxVisits.value})
        window.close();
     });
   }
}

/*
   <Unlimit website> button
   Removes the website entry from the Chrome storage and refreshes the page.
*/
clearBtn.onclick = function() {
   chrome.tabs.query({'active': true, currentWindow: true},
   function(tabs){
      let url = new URL(tabs[0].url);
      chrome.storage.sync.remove(url.hostname);
      chrome.runtime.sendMessage({msg: "clearOneDomain", hostname: url.hostname})
      window.close();
   });
}

/*
   <Unlimit all sites> button
   Clears the Chrome storage and refreshes the page.
*/
clearAllBtn.onclick = function() {
   chrome.runtime.sendMessage({msg: "clearAll"})
   window.close()
}


/* ===================== Initialization ===================== */

setHostname();
start();
setLinks();
