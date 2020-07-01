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
	res.render('main.ejs')
})

function getTips(emotions) {
	var items;
	var passedEmotions = emotions;
	selectedTips = []
	items = fs.readFileSync('content.json');
	items = items.toString()
	items = JSON.parse(items)
	for (var i = 0; i < passedEmotions.length; i++) {
		//console.log(items[passedEmotions[i]])
		response = items[passedEmotions[i]][Math.floor(Math.random() * items[passedEmotions[i]].length)];
		selectedTips.push(response)
	}
	return selectedTips
}

app.get("/History", function(req, res) {
	res.render("history.ejs")
})

app.get("/How", function(req, res) {
	res.render("how.ejs")
})

app.post("/result", function(req, res) {
	var results = req.body.toBeCalc

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
	result = getTips(final)
	io.to(req.body.socketid).emit('messages', final);
	io.to(req.body.socketid).emit('tips', result)

})


server = https.createServer({key: privateKey, cert: certificate}, app).listen(443, '192.168.1.176')
var io = require('socket.io').listen(server);
io.on('connection', function(client) {
	client.on('join', function(data) {
        console.log(data)
    })
})
