var socket = io('https://fbbsvr.ddns.net', { transport : ['websocket'] });
socket.on('connect', function(data) {
    socket.emit('join', socket.id);
});

const video = document.getElementById('video')
var complete = false;
function begin() {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]).then(
          getVideo,
          setTimeout(function() {
              complete = true
              getVideo()
          }, 5000)
      )
}
var results = []

function getVideo() {
    results = []
navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.log("Face not detected")
    )
}


video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    stream = document.getElementById("videostream").append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    if (!complete) {
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
	    result = resizedDetections[0].expressions
            results.push(result)
            }, 100)
    } else {
        fetch('/result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                toBeCalc: results,
                socketid: socket.id
            })
        })
    }
})


socket.on('messages', function(data) {
    if (data.length == 0) {
        document.getElementById("results").innerText = "No emotion detected"
    }
    else {
        document.getElementById("emotionTitle").innerText = "You are expressing the following emotions:"
        document.getElementById("results").innerText = data
    }

    var entries = JSON.parse(localStorage.getItem("allEntries"));
    if(entries == null) entries = [];

    var date = new Date()
    currentDate = date.toLocaleString()

    for (item in data) {
        console.log(data[item])
        var setup = data[item] + "?" + currentDate
        entries.push(setup)
    }

    localStorage.setItem("allEntries", JSON.stringify(entries));
    


});

socket.on('tips', function(data) {
    for (item in data) {
        tip = document.createElement("h1").innerText = data[item].tip
        document.getElementById("tipcontainer").append(tip)
    }
    document.getElementById("tipTitle").innerText = "Here are some tips to help you throughout the day:"
})
