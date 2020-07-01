var socket = io('https://fbbsvr.ddns.net:80', { transport : ['websocket'] });
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


function getVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.log("Face not detected")
    )
}

results = []

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
        console.log(results)
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
    console.log(data)
    var full;
    for (item in data) {
        full = full + item
    }
    document.getElementById("results").innerText = data
});
