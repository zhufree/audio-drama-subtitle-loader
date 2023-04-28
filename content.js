chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
});

let subtitleList = []
let subtitleP = []
let defaultColor = '#111111'
let defaultSize = 1
// const localColor = localStorage.getItem('subtitle-color')
// const localSize = localStorage.getItem('subtitle-size')
// if (localColor && (localColor.length || localColor.length == 9) && localColor.startsWith('#')) {
//   defaultColor = localColor
// }
// if (localSize) {
//   defaultSize = parseInt(localSize)/100
// }

// Function to handle selecting a local subtitle file
function selectLocalSubtitleFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".srt,.lrc,.csv"; //,.ass
  input.addEventListener("change", function() {
    const file = input.files[0]
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", function() {
        const contents = reader.result
        subtitleList = []
        subtitleToShow = []
        if (subtitleP.length === 0) {
          subtitleP = document.getElementsByClassName('subtitle-line')
        }
        subtitleP[0].innerText = `Load file: ${fileName}`

        if (fileExtension === 'srt') {
          parseSRT(contents)
        } else if (fileExtension === 'lrc') {
          parseLRC(contents)
        } else if (fileExtension === 'ass') {
          parseLRC(contents)
        } else if (fileExtension === 'csv') {
          parseCSV(contents)
        } else {
          subtitleP.innerText += 'Unsupported Format'
        }
        
      })
      let subtitleContainer = document.getElementById('load-subtitle-container')
      subtitleContainer.style.display = 'block'
      reader.readAsText(file)
    }
  });
  input.click();
}


let oldTime = ''
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    // Respond to the mutation (e.g. update subtitle display)
    let time = mutation.target.innerText
    if (time!= oldTime) {
      refreshSubtitle(time)
      oldTime = time
    } 
  })
})

let subtitleToShow = []
function refreshSubtitle(time) {
  if (subtitleP.length === 0) {
    subtitleP = document.getElementsByClassName('subtitle-line')
  }
  const [min, sec] = time.split(':').map((i) => parseInt(i))
  let currentSecond =  min * 60 + sec
  for (const sub of subtitleList) {
    if (sub.startSecond <= currentSecond && sub.endSecond > currentSecond) {
      if (!subtitleToShow.find((subtitle) => subtitle.content === sub.content)) {
        subtitleToShow.push(sub)
      }
    } else {
      subtitleToShow = subtitleToShow.filter((subtitle) => subtitle.content !== sub.content)
    }
  }
  if (subtitleToShow.length > 0) {
    const firstSub = subtitleToShow[0]
    subtitleP[0].style.color = firstSub.color ? firstSub.color : defaultColor
    subtitleP[0].innerText = firstSub.content
    if (subtitleToShow.length > 1) {
      const secondSub = subtitleToShow[1]
      subtitleP[1].style.color = secondSub.color ? secondSub.color : defaultColor
      subtitleP[1].innerText = secondSub.content
    } else {
      subtitleP[1].innerText = ''
      subtitleP[1].style.color = defaultColor
    }
  } else {
    subtitleP[0].style.color = defaultColor
    subtitleP[1].style.color = defaultColor
    if (!subtitleP[0].innerText.includes('Load')) {
      subtitleP[0].innerText = ''
    }
    subtitleP[1].innerText = ''
  }
}

// Configuration of the observer:
const config = { attributes: true, childList: true, characterData: true };

// Pass in the target node, as well as the observer options

function addElements() {
  // add load file btn
  const button = document.createElement("button")
  button.style.backgroundColor = "#065279"
  button.style.color = "white"
  button.style.fontSize = (isMsite ? "12px" : "1rem") 
  button.innerText = "Select sub file"
  if (isMsite) {
    button.classList.add('btn-larger')
    button.classList.add('btn-red')
  }
  button.addEventListener("click", function() {
    // Call a function to handle selecting a local subtitle file
    selectLocalSubtitleFile()
  });
  const switches = isMsite ? document.querySelector('div.sound-action-container') : document.querySelector("div.danmaku-area")
  switches.appendChild(button)

  // add display area
  const newDiv = document.createElement("div")
  newDiv.style.height = "auto"
  newDiv.style.minHeight = "4.5rem"
  newDiv.setAttribute("id", "load-subtitle-container")
  newDiv.style.width = "100%"
  newDiv.style.display = 'none'
  addNewP(newDiv)
  addNewP(newDiv)
  const soundContainer = isMsite? document.querySelector('.danmaku-stage-wrap') : document.querySelector(".web-sound-container")
  soundContainer.insertBefore(newDiv, soundContainer.firstChild)
}

function addNewP(parentNode) {
  const newP = document.createElement("p")
  newP.setAttribute("class", "subtitle-line")
  newP.style.width = isMsite ? "100%" : "80%"
  newP.style.margin = '0 auto'
  newP.style.color = '#111111'
  newP.style.fontSize =  1.5 * defaultSize + 'rem'
  newP.style.textAlign = 'center'
  parentNode.appendChild(newP)
}
let soundId = -1

function fetchSubtitleMap() {
  fetch('https://raw.githubusercontent.com/zhufree/subtitle-storage/main/missevan-subtitle-map.json')
    .then(response => response.json())
    .then(data => {
      if (Object.keys(data).includes(soundId)) {
        const subtitleUrl = data[soundId]
        fetch(subtitleUrl)
        .then(response => response.text())
        .then(text => {
          subtitleList = []
          const urlParts = subtitleUrl.split('/')
          const fileName = urlParts[urlParts.length - 1]
          if (subtitleP.length === 0) {
            subtitleP = document.getElementsByClassName('subtitle-line')
          }
          subtitleP[0].innerText = `Load Subtitle: ${fileName}`
          if (subtitleUrl.endsWith('.srt')) {
            parseSRT(text)
          } else if (subtitleUrl.endsWith('.lrc')) {
            parseLRC(text)
          } else if (subtitleUrl.endsWith('.csv')) {
            parseCSV(text)
          }
          let subtitleContainer = document.getElementById('load-subtitle-container')
          subtitleContainer.style.display = 'block'
        })
      }
    })
    .catch(error => console.error(error))
}

let isMsite = false
// Wait for the page to finish loading
window.addEventListener("load", function() {
  if (window.location.href.includes('www.missevan')) {
    const urlParams = new URLSearchParams(window.location.search);
    soundId = urlParams.get('id')
  } else {
    const soundIdRegex = /sound\/(\d+)/
    soundId = window.location.href.match(soundIdRegex)[1]
    isMsite = true
  }
  addElements()
  fetchSubtitleMap()
  const target = isMsite ? document.querySelector('.played-time') : document.querySelector('div.mpsp');
  observer.observe(target, config); 
})

function parseSRT(text) {
	const subs = text.split('\r\n\r\n')
	for (let sub of subs) {
		if (sub.length > 0) {
			const lines = sub.split('\r\n')
			const startTS = lines[1].split(' --> ')[0]
      const endTS = lines[1].split(' --> ')[1]
      const [hour1, min1, second1, milliSecond1] = startTS.split(/:|,/).map((i) => parseInt(i))

			let startSecond = hour1*3600 + min1*60+second1
      if (milliSecond1 > 500) {
        startSecond += 1
      }
      let [hour2, min2, second2, milliSecond2] = endTS.split(/:|,/).map((i) => parseInt(i))
      let endSecond = hour2*3600 + min2*60+second2
      if (milliSecond2 > 500) {
        endSecond += 1
      }
			for (index in lines) {
				if (index > 1 && lines[index].length > 0) {
          subtitleList.push({
            'content': lines[index],
            'startSecond': startSecond,
            'endSecond': endSecond
          })
				}
			}
		}
	}
}

function parseLRC(text) {
  const subs = text.split('\r\n').filter((sub) => sub.startsWith('['))
	for (let sub of subs) {
		if (sub.length > 0) {
			const timeAndContent = sub.split(']')
      const [min, sec, milliSecond] = timeAndContent[0].slice(1).split(/:|,/).map((i) => parseInt(i))
      const content = timeAndContent[1].trim()
      let startSecond = min * 60 + sec
      if (milliSecond > 500) {
        startSecond += 1
      }
      subtitleList.push({
        'content': content,
        'startSecond': startSecond,
        'endSecond': -1
      })
		}
	}
}

function parseCSV(text) {
  const rows = text.split(/\r?\n/) // 将CSV字符串按行切割
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length === 0) {
      continue
    }
    const currentLine = rows[i]
    const lineItems = []
    let count = 0
    let startIndex = 0
    for (var j = 0; j < currentLine.length; j++) {
      if (currentLine[j] === ',') {
        count++;
        if (count <= 2) {
          lineItems.push(currentLine.substring(startIndex, j));
          startIndex = j + 1;
        }
      }
    }
    let color = '#111111'
    let content = ''
    if (!currentLine.endsWith(',')) {
      const contentEndIndex = currentLine.indexOf(',#')
      color = '#' + currentLine.split(',#')[1]
      content = currentLine.substring(startIndex, contentEndIndex)
    } else {
      content = currentLine.substring(startIndex, currentLine.length-1)
    }
    const startTime = lineItems[0]
    const endTime = lineItems[1]
    const startSecond = caculateCSVTimeFormat(startTime)
    const endSecond = caculateCSVTimeFormat(endTime)
    subtitleList.push({
      'content': content,
      'startSecond': startSecond,
      'endSecond': endSecond,
      'color': color
    })
  }
}

function caculateCSVTimeFormat(str) {
  const [time, miliSeconds] = str.split('.')
  const [hours, minutes, seconds] = time.split(':') // 将时间按冒号切成小时、分钟、秒
  let totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds); // 计算总秒数
  if (parseInt(miliSeconds) > 50) {
    totalSeconds += 1
  }
  return totalSeconds
}