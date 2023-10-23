var socket = io();
var hosts;
var wol_resp = false
fetch('hosts.json')
    .then(res => res.json())
    .then(data => {
        hosts = data;
    })
    .then(() => {
        console.log(hosts);
    });
let timer = setInterval(function () {
    for (let host of hosts) {
        fetch("http://" + host.ip + ":2000/stats")
            .then(res => res.json())
            .then(data => {
                if (data != undefined) {
                    var elem = document.getElementById(host.name + "-stats")
                    elem.innerHTML = "CPU: " + data.cpu_temp + "°C " + data.cpu_usage + "%<br>MEM: " + data.memory_usage + "%"

                    host["status"] = true;
                    var elem = document.getElementById(host.name + "-label")
                    elem.style.pointerEvents = "none"
                    document.getElementById(host.name).checked = true;
                }
            })
            .catch(error => {
                if (wol_resp == false) {
                    var elem = document.getElementById(host.name + "-stats")
                    elem.innerHTML = "CPU: 0°C 0%<br>MEM: 0%"

                    host["status"] = false;
                    var elem = document.getElementById(host.name + "-label")
                    elem.style.pointerEvents = "all"
                    document.getElementById(host.name).checked = false;
                }
            })
    }
}, 1500);

function wol(id) {
    for (let host of hosts) {
        if (host.name == id) {
            socket.emit("wol", id);
            break;
        }
    }
}
function shutdown(id) {
    for (let host of hosts) {
        if (host.name == id) {
            fetch("http://" + host.ip + ":2000/shutdown")
            break;
        }
    }
}
function reboot(id) {
    for (let host of hosts) {
        if (host.name == id) {
            fetch("http://" + host.ip + ":2000/reboot")
            break;
        }
    }
}
socket.on("wol_resp", (res) => {
    var id = res.id
    if (res.response == true) {
        wol_resp = true;
        for (let host of hosts) {
            if (host.name == id) {
                host["status"] = true;
                break;
            }
        }
        var elem = document.getElementById(id + "-label")
        elem.style.pointerEvents = "none"
        document.getElementById(id).checked = true;
        setTimeout(function () { wol_resp = false }, 3000);
    }
})



