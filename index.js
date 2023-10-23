const wol = require('wakeonlan')
const schedule = require('node-schedule');
const fs = require('fs');


//get the schedule
var rawdata = fs.readFileSync('public/schedule.json');
const schedule_file = JSON.parse(rawdata);
//get hosts from host file
var rawdata = fs.readFileSync('public/hosts.json');
const hosts = JSON.parse(rawdata);
//adding the schedule to node.js
//https://stackoverflow.com/questions/63776142/json-file-copied-inside-docker-is-not-changed-after-updating-file-from-python-sc
function command(schedule_e) {
    let host_id = schedule_e.host
    let host = hosts[host_id]
    if (schedule_e.command == "wol") {
        wol(host.mac).then(() => {
            console.log(host.name + " waken up at ", schedule_e.time)
        })
    }
    else {
        fetch("http://" + host.ip + ":2000/" + schedule_e.command).then(() => {
            console.log(host + " " + schedule_e.command + " at " + schedule_e.time)
        }).catch(error => {
            console.log(host.name + " can't be reached")
        });
    }
}
for (const key in schedule_file) {
    for (const schedule_e of schedule_file[key]) {
        if (schedule_e.active == true) {
            schedule.scheduleJob(schedule_e.time, function () { command(schedule_e) });
        }
    }
}

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//server
server.listen(3000, () => {
    console.log('listening on *:3000');
});

let ejs = require('ejs');
app.set('view engine', 'ejs')

app.use('/', express.static(__dirname + '/public'));

app.get("/", function (req, res) {
    res.render("index", { hosts: hosts })
});

app.get("/schedule/:host", function (req, res) {
    let host = req.params.host
    res.render("schedule", { schedule_host: schedule_file[host], host: host })
});
app.get("/wol/:host", function (req, res) {
    let host_p = req.params.host
    for (let host of hosts) {
        if (host.name == host_p) {
            // MAC is case-insensitive. colons optional
            wol(host.mac).then(() => {
                res.json({"response":true});
            })
            break
        }
    }
});
function save_to_schedule_file() {
    let data = JSON.stringify(schedule_file, null, 2);
    fs.writeFile('public/schedule.json', data, (err) => {
        if (err) throw err;
        console.log('schedule modified');
    });
}
io.on('connection', async function (socket) {
    socket.on("wol", (id) => {
        for (let host of hosts) {
            if (host.name == id) {
                // MAC is case-insensitive. colons optional
                wol(host.mac).then(() => {
                    socket.emit("wol_resp", { response: true, id: id })
                })
                break
            }
        }
    })
    socket.on("schedule_change", (data) => {
        if (data != undefined && data != null) {
            let host_name = data.host_name
            schedule_file[host_name] = data.schedule_file
            save_to_schedule_file()
        }
    })

});