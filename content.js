let coverDiv = document.createElement("div");

/*
    Setting global variables from data injected from background listener.
*/
let startTime = new Date(JSON.parse(dataObj["startTime"])).getTime();
let endTime = new Date(JSON.parse(dataObj["endTime"])).getTime();

/*
    Remove existing contents of the website's head, body tags.
*/
function removeExistingComponents() {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    document.getElementsByTagName("body")[0].removeAttribute("class");
    document.getElementsByTagName("html")[0].removeAttribute("class");
    // document.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    // document.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.parentNode.removeChild(el));
}

/*
    Create new div with status information.
*/
function createComponents() {
    document.body.appendChild(coverDiv);
    
    let title = document.createElement("h1");
    var titleText = document.createTextNode(hostname + " is blocked!")
    title.appendChild(titleText);
    coverDiv.appendChild(title);
    
    var info = document.createElement("p");
    var infoText = document.createTextNode("You have exceeded the maximum number of visits to this domain, you will be locked out until the timer is up.");
    
    info.appendChild(infoText);
    coverDiv.appendChild(info)
    
    var timer = document.createElement("p");
    timer.id = "timer"
    coverDiv.appendChild(timer);
}

/* 
    Debugging components
    Shows the start and end times, website root domain, visit count, and max visits.
*/
function createDebuggingComponents() {
    var debugParagraph = document.createElement("p");
    var debugHeader = document.createElement("h1");
    var debugDescription = document.createTextNode("Debugging Information")
    var websiteName = document.createTextNode("Website: " + hostname);
    var visitCount = document.createTextNode("Visits: " + (dataObj["currentCount"] + 1));
    var maxCount = document.createTextNode("Max visits: " + dataObj["maxCount"]);
    debugHeader.appendChild(debugDescription);
    debugParagraph.appendChild(debugHeader);
    debugParagraph.appendChild(websiteName);
    debugParagraph.appendChild(document.createElement("br"));
    debugParagraph.appendChild(visitCount);
    debugParagraph.appendChild(document.createElement("br"));
    debugParagraph.appendChild(maxCount);
    debugParagraph.appendChild(document.createElement("br"));
    debugParagraph.appendChild(document.createTextNode("Start time: " + (new Date(startTime).toString())));
    debugParagraph.appendChild(document.createElement("br"));
    debugParagraph.appendChild(document.createTextNode("End time: " + (new Date(endTime).toString())));
    debugParagraph.appendChild(document.createElement("br"));
    coverDiv.appendChild(debugParagraph);
}

/*
    Create and display a countdown timer.
*/
function startCountdown() {
    var interval = setInterval(function() {
        var now = new Date().getTime();
        var distance = endTime - now;

        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById("timer").innerHTML = "Remaining time: " + hours + "h " + minutes + "m " + seconds + "s ";
        if (hours == 0 && minutes == 0 && seconds == 0) {
            clearInterval(interval);
            finishCountdown();
        }
    });
}

/*
    Create and display a redirect timer, remove expired Limiter from the Chrome storage, and refresh the page.
*/
function finishCountdown() {
    let redirectTime = 3;
    var redirectInterval = setInterval(function() {
        document.getElementById("timer").innerHTML = "No longer blocked! Refreshing in " + redirectTime + " seconds...";
        redirectTime--;
        if (redirectTime < 0) {
            chrome.storage.sync.remove(hostname);
            clearInterval(redirectInterval)
            window.location.reload();
        }
    }, 1000);
}

/* ===================== Initialization ===================== */

removeExistingComponents();
createComponents();
createDebuggingComponents();
startCountdown();