chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
});

let subtitleList = []
let subtitleToShow = []
let subtitleP = []
let duration = -1
let soundId = -1
let defaultColor = '#EEEEEE'
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
      subtitleContainer.style.display = 'flex'
      reader.readAsText(file)
    }
  });
  input.click();
}


function refreshSubtitle(currentTime) {
  if (subtitleP.length === 0) {
    subtitleP = document.getElementsByClassName('subtitle-line')
  }
  for (const sub of subtitleList) {
    if (sub.endSecond > -1) {
      if (sub.startSecond <= currentTime && sub.endSecond > currentTime) {
        if (!subtitleToShow.find((subtitle) => subtitle.id === sub.id)) {
          subtitleToShow.push(sub)
        }
      } else {
        subtitleToShow = subtitleToShow.filter((subtitle) => subtitle.id !== sub.id)
      }
    } else {
      // handle lrc
      if (currentTime > sub.startSecond) {
        if (!subtitleToShow.find((subtitle) => subtitle.id === sub.id)) {
          subtitleToShow = [sub]
        }
      }
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


function addElements() {
  // add load file btn
  const button = document.createElement("button")
  button.style.backgroundColor = "#065279"
  button.style.color = "white"
  button.style.fontSize = "1rem" 
  button.innerText = "Select sub file"
  button.addEventListener("click", function() {
    // Call a function to handle selecting a local subtitle file
    selectLocalSubtitleFile()
  })
  const switches = document.querySelector("div.danmaku-area")
  switches.appendChild(button)

  // add display area
  const newDiv = document.createElement("div")
  newDiv.setAttribute("id", "load-subtitle-container")
  newDiv.style.position = 'fixed'
  newDiv.style.background = '#33333388'
  newDiv.style.bottom = '50px'
  newDiv.style.zIndex = 99
  newDiv.style.minHeight = "4.5rem"
  newDiv.style.width = "100%"
  newDiv.style.display= "none"
  newDiv.style.alignItems = 'center'
  newDiv.style.justifyContent = 'center'
  newDiv.style.flexDirection = 'column'
  addNewP(newDiv)
  addNewP(newDiv)
  const soundContainer = document.querySelector("#new_content")
  soundContainer.insertBefore(newDiv, soundContainer.firstChild)
}

function addNewP(parentNode) {
  const newP = document.createElement("p")
  newP.setAttribute("class", "subtitle-line")
  newP.style.width = "100%"
  newP.style.color = '#EEEEEE'
  newP.style.fontSize =  1.5 * defaultSize + 'rem'
  newP.style.textShadow = '0 0 #111'
  newP.style.textAlign = 'center'
  parentNode.appendChild(newP)
}


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
          subtitleContainer.style.display = 'flex'
        })
      }
    })
    .catch(error => console.error(error))
}

const config = { attributes: true, childList: true, characterData: true };
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    // Respond to the mutation (e.g. update subtitle display)
    let time = mutation.target.innerText
    if (!time.startsWith('0')) {
      const [min, second] = document.querySelector('.mpsa').innerText.split(':').map((i) => parseInt(i))
      const totalTime = document.querySelector('.mpsa').innerText
      duration = min * 60 + second
      observer.disconnect()
    } 
  })
})

// Wait for the page to finish loading
window.addEventListener("load", function() {
  const urlParams = new URLSearchParams(window.location.search);
  soundId = urlParams.get('id')
  // wait for the total time to show (not 0:00)
  const observerTarget = document.querySelector('.mpsa')
  observer.observe(observerTarget, config)
  addElements()
  fetchSubtitleMap()
  const interval = setInterval(function() {
    const percent = document.querySelector('div.mpl').style.width.replace('%', '')
    if (percent == 100) {
      clearInterval(interval)
    }
    const currentTime = parseFloat(percent) / 100 * duration
    refreshSubtitle(currentTime)
  }, 100) 
})

function parseSRT(text) {
  console.log('Start parse SRT file...')
	const subs = text.split(/\r?\n\r?\n/)
  let index = 0
	for (let sub of subs) {
		if (sub.length > 0) {
			const lines = sub.split(/\r?\n/)
			const startTS = lines[1].split(' --> ')[0]
      const endTS = lines[1].split(' --> ')[1]
      const [hour1, min1, second1, milliSecond1] = startTS.split(/:|,/).map((i) => parseInt(i))
			let startSecond = hour1*3600 + min1*60+second1 + milliSecond1 / 1000
      let [hour2, min2, second2, milliSecond2] = endTS.split(/:|,/).map((i) => parseInt(i))
      let endSecond = hour2*3600 + min2*60+second2 + milliSecond2 / 1000
			for (lineId in lines) {
				if (lineId > 1 && lines[lineId].length > 0) {
          subtitleList.push({
            'id': index,
            'content': lines[lineId],
            'startSecond': startSecond,
            'endSecond': endSecond
          })
          index ++
				}
			}
		}
	}
}

function parseLRC(text) {
  console.log('Start parse LRC file...')
  const subs = text.split(/\r?\n/).filter((sub) => sub.startsWith('['))
  let index = 0
	for (let sub of subs) {
		if (sub.length > 0) {
			const timeAndContent = sub.split(']')
      const [min, sec, milliSecond] = timeAndContent[0].slice(1).split(/:|\./).map((i) => parseInt(i))
      const content = timeAndContent[1].trim()
      let startSecond = min * 60 + sec + milliSecond / 100
      subtitleList.push({
        'id': index,
        'content': content,
        'startSecond': startSecond,
        'endSecond': -1
      })
      index ++
		}
	}
}

function parseCSV(text) {
  console.log('Start parse CSV file...')
  const rows = text.split(/\r?\n/) // 将CSV字符串按行切割
  let index = 0
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
    let color = defaultColor
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
      'id': index,
      'content': content,
      'startSecond': startSecond,
      'endSecond': endSecond,
      'color': color
    })
    index ++
  }
  console.log(`Get ${index} sub items...`)
}

function caculateCSVTimeFormat(str) {
  const [time, miliSeconds] = str.split('.')
  const [hours, minutes, seconds] = time.split(':') // 将时间按冒号切成小时、分钟、秒
  let totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + miliSeconds/100 // 计算总秒数
  return totalSeconds
}