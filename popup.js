document.getElementById("readContent").onclick = function () {
  console.log('click')
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    console.log('send' + tabs[0].id)
    chrome.tabs.sendMessage(tabs[0].id, { action: "downloadContent" });
  });
};