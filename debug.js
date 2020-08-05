/* Use these commands in the console of the Limiter background page in chrome://extensions */

// Use this to grab all the storage data
chrome.storage.sync.get(null, function(items) {
    console.log(items);
});

// WARNING: This will permanently clear ALL storage, including those added by other extensions/apps.
chrome.storage.sync.clear();
