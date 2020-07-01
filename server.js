const express = require('express')
const app = express()
const fs = require("fs");
var bodyParser = require('body-parser');
var https = require('https');
var privateKey = fs.readFileSync('privkey.pem')
var certificate = fs.readFileSync('cert.pem')

app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.static(__dirname + '/Public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.get("/", function(req, res) {
    fs.readFile('content.json', function (error, data) {
		if (error) {
			res.status(500).end()
		} else {
			res.render('main.ejs', {
                items: JSON.parse(data)
			})
        }
    })
})

app.post("/result", function(req, res) {
	var results = req.body.toBeCalc
	console.log(results)

	var keys = []

	for (var i = 0; i < results.length; i++) {
		tempArr = []
		for (item in results[i]) {
			tempArr.push(results[i][item])
		}
		tempArr.sort(function(a, b){return b-a});
		l = tempArr[0]
		keys.push(Object.keys(results[i]).find(key => results[i][key] === l))
	}
	var final = Array.from(new Set(keys)) //results to be sent to the client
	io.to(req.body.socketid).emit('messages', final);

})


server = https.createServer({key: privateKey, cert: certificate}, app).listen(80, '192.168.1.176')
var io = require('socket.io').listen(server);
io.on('connection', function(client) {
	client.on('join', function(data) {
        console.log(data)
    })
})
