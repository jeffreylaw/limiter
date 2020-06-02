// Use this to grab all the storage data
chrome.storage.sync.get(null, function(items) {
    console.log(items);
});

// Use this to clear existing storage
chrome.storage.sync.clear();
