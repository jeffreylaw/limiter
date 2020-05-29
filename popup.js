let addSite = document.getElementById("addSite");

addSite.onclick = function(event,) {
    chrome.tabs.query({'active': true, currentWindow: true},
   function(tabs){
      alert(tabs[0].url);
      var url = new URL(tabs[0].url);
      alert(url.hostname);
      let key = url.hostname;
      let currentTime = new Date();
      let expiryTime = new Date(currentTime);
      expiryTime.setHours(currentTime.getHours() + 1);
      // alert(currentTime);
      // alert(expiryTime);
      let data = {
         "startTime": currentTime,
         "endTime": expiryTime,
      }
      console.log(data);
      chrome.storage.sync.set({key: data})
      chrome.storage.sync.get([key], function(result) {
         console.log(result[key]);
         // console.log(result["endTime"]);
         // alert(result["endTime"]); 
      })
      chrome.storage.sync.clear();
   }
);
}

