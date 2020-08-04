let html = document.getElementsByTagName("html")[0];
let head = document.getElementsByTagName("head")[0]
let body = document.getElementsByTagName("body")[0];
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
    document.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    document.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.parentNode.removeChild(el));
    document.querySelectorAll('style').forEach(el => el.parentNode.removeChild(el));
    document.querySelectorAll('iframe').forEach(el => el.parentNode.removeChild(el));
}

/*
    Dynamically set styles
*/
function setStyles() { 
    html.style.backgroundColor = "#F3EAE6";
    document.querySelectorAll('h1').forEach(el => {
        el.style.color = "#2b2b2b"
        el.style.fontFamily = "Roboto, sans-serif";
    });
    document.querySelectorAll('p').forEach(el => {
        el.style.color = "#2b2b2b"
        el.style.fontFamily = "Roboto, sans-serif";
    });

    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.type = "text/css";
    link.href = "https://fonts.googleapis.com/css2?family=Roboto&display=swap";
    head.appendChild(link);
}


/*
    Create new div with status information.
*/
function createComponents() {
    document.body.appendChild(coverDiv);
    
    let title = document.createElement("h1");
    title.style.textAlign = "center";
    let titleText = document.createTextNode(hostname + " is blocked!");
    title.appendChild(titleText);
    coverDiv.appendChild(title);
    
    let pikachuGif = document.createElement("img");
    pikachuGif.style.display = "block";
    pikachuGif.style.margin = "0 auto";
    pikachuGif.setAttribute("src", chrome.runtime.getURL('./images/sad_pikachu.gif'));
    coverDiv.appendChild(pikachuGif);

    let info = document.createElement("p");
    info.style.textAlign = "center";
    info.style.fontSize = "25px";
    let infoText = document.createTextNode("You have exceeded the number of visits to this domain.");
    
    info.appendChild(infoText);
    coverDiv.appendChild(info)
    
    let timer = document.createElement("p");
    timer.style.textAlign = "center";
    timer.style.fontSize = "25px";
    timer.id = "timer";
    coverDiv.appendChild(timer);
}

/* 
    Component for debugging ONLY
    Shows the start and end times, website root domain, visit count, and max visits.
*/
function createDebuggingComponents() {
    let debugParagraph = document.createElement("p");
    let debugHeader = document.createElement("h1");
    let debugDescription = document.createTextNode("Debugging Information");
    let websiteName = document.createTextNode("Website: " + hostname);
    let visitCount = document.createTextNode("Visits: " + (dataObj["currentCount"] + 1));
    let maxCount = document.createTextNode("Max visits: " + dataObj["maxCount"]);
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
    let interval = setInterval(function() {
        let now = new Date().getTime();
        let distance = endTime - now;

        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById("timer").innerHTML = "Blocked until: " + hours + "h " + minutes + "m " + seconds + "s ";
        if (hours == 0 && minutes == 0 && seconds == 0 || seconds < 0) {
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
    let redirectInterval = setInterval(function() {
        document.getElementById("timer").innerHTML = "No longer blocked! Refreshing in " + redirectTime + " seconds...";
        redirectTime--;
        if (redirectTime < 0) {
            chrome.storage.sync.remove(hostname);
            clearInterval(redirectInterval);
            window.location.reload();
        }
    }, 1000);
}

/*
    Listen for messages from background script.
*/
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.msg == "Are you there content script?") {
          sendResponse({msg: "Yes"});
      }
    }
);


/* ===================== Initialization ===================== */

removeExistingComponents();
createComponents();
setStyles();
/* Uncomment this to view debugging info */
// createDebuggingComponents();
startCountdown();