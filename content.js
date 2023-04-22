chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
});

let subtitleList = []
let subtitleP


// Function to handle selecting a local subtitle file
function selectLocalSubtitleFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".srt,.lrc,.ass,.csv";
  input.addEventListener("change", function() {
    const file = input.files[0]
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", function() {
        const contents = reader.result
        subtitleList = []
        if (!subtitleP) {
          subtitleP = document.getElementById('subtitle-line')
        }
        subtitleP.innerText = `Load file: ${fileName}`

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



const target = document.querySelector('div.mpsp');
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

function refreshSubtitle(time) {
  if (!subtitleP) {
    subtitleP = document.getElementById('subtitle-line')
  }
  const [min, sec] = time.split(':').map((i) => parseInt(i))
  let currentSecond =  min * 60 + sec
  let subtitleToShow = ''
  let subtitleToEnd = ''
  let color = ''
  for (const sub of subtitleList) {
    if (sub.startSecond == currentSecond) {
      if (sub.endSecond == -1) {
        subtitleToShow = sub.content
      } else {
        subtitleToShow += sub.content
      }
      color = sub.color?sub.color:'#000000'
    }
    if (sub.endSecond == currentSecond) {
      subtitleToEnd += sub.content
    }
  }
  if (subtitleToShow !== '') {
    subtitleP.style.color = color
    subtitleP.innerText = subtitleToShow
  }
  if (subtitleP.innerText == subtitleToEnd) {
    subtitleP.innerText = ''
  }
}

// Configuration of the observer:
const config = { attributes: true, childList: true, characterData: true };

// Pass in the target node, as well as the observer options
observer.observe(target, config); 


// Wait for the page to finish loading
window.addEventListener("load", function() {
  const button = document.createElement("button")
  button.style.backgroundColor = "#065279"
  button.style.color = "white"
  button.innerText = "Select sub file"
  button.addEventListener("click", function() {
    // Call a function to handle selecting a local subtitle file
    selectLocalSubtitleFile()
  });
  const switches = document.querySelector("div.danmaku-area")
  switches.appendChild(button)
  const newDiv = document.createElement("div")
  newDiv.style.height = "3rem"
  newDiv.setAttribute("id", "load-subtitle-container")
  newDiv.style.width = "100%"
  newDiv.style.display = 'none'
  const newP = document.createElement("p")
  newP.setAttribute("id", "subtitle-line")
  newP.style.width = "70%"
  newP.style.margin = '0 auto'
  newP.style.color = '#f20c00'
  newP.style.fontSize = '2rem'
  newP.style.textAlign = 'center'
  newDiv.appendChild(newP)
  const soundContainer = document.querySelector(".web-sound-container")
  soundContainer.insertBefore(newDiv, soundContainer.firstChild)
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
  const rows = text.split('\n') // 将CSV字符串按行切割
  for (let i = 1; i < rows.length; i++) {
    const [startTime, endTime, ...rest] = rows[i].split(',')
    const startSecond = caculateCSVTimeFormat(startTime)
    const endSecond = caculateCSVTimeFormat(endTime)
    const content = rest[0]
    const color = rest[1] !== '' ? rest[1] : '#000000'
    subtitleList.push({
      'content': content,
      'startSecond': startSecond,
      'endSecond': endSecond,
      'color': color
    })
  }
  console.log(subtitleList)
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