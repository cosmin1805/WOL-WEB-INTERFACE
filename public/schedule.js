let socket = io();
let hosts;
let schedule_file;
let index = document.URL.lastIndexOf("/")
let host_name = document.URL.substring(index + 1)
let host_index 
fetch('/hosts.json')
    .then(res => res.json())
    .then(data => {
        hosts = data;
    })
    .then(() => {
        console.log(hosts);
        for(var i = 0;i<hosts.length;i++)
        {
            if(hosts[i].name==host_name)
            {
                host_index = i
                break
            }
        }
    });
fetch('/schedule.json')
    .then(res => res.json())
    .then(data => {
        schedule_file = data[host_name];
    })
    .then(() => {
        console.log(schedule_file);
    });

//to change local data
function command_change(element) {
    schedule_file[element.id].command = element.value
}
function hour_change(element) {
    schedule_file[element.id].time.hour = element.value
}

function minute_change(element) {
    schedule_file[element.id].time.minute = element.value
}
function dates_change(options,id) {
    let dates = []
    for (let option of options) {
        dates.push(option.value)
    }
    schedule_file[id].time.dayOfWeek = dates
}
function active_change(element) {
    if (element.value == "true") {
        schedule_file[element.id].active = true
    }
    else {
        schedule_file[element.id].active = false
    }
}
//save local data to the file
function socket_file_change()
{
    socket.emit("schedule_change",{schedule_file,host_name})
    setTimeout(function(){ location.reload(); }, 3000);
}
//add new entry to file
function add_entry(){
    if (confirm("Do you really want to add a schedule?") == false) {
        return
    }
    let new_entry = {
        "time": {
            "hour": 00,
            "minute": 0,
            "dayOfWeek": []
        },
        "active": false,
        "command": "wol",
        "host" : host_index
    }
    schedule_file.push(new_entry)
    socket_file_change()
}
//delete entry to file
function delete_entry(id)
{
    schedule_file.splice(id,1)
    socket_file_change()
}
function delete_middle_button(e, id) {
    if (e.button === 1) {
        if (confirm("Do you really want to delete the " + id + " schedule") == true) {
            delete_entry(id)
        }
    }
}
function delete_button() {
    let id = prompt("Enter the index of the entry you want to delete(it starts with 0)", "");
    if (isNaN(id) || schedule_file.length - 1 < id) {
        alert("Must input numbers or something within the limit of the table");
        delete_button()
        return false;
    }
    if (id != null && id != "") {
        delete_entry(id)
    }
    else{
        alert("canceled")
    }
}