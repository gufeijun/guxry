const fs= require("fs")

function dateFormat(format="YYYY-MM-DD HH:mm:ss"){
    let date = new Date();
    const config={
        YYYY:date.getFullYear(),
        MM:padding(date.getMonth()+1),
        DD:padding(date.getDate()),
        HH:padding(date.getHours()),
        mm:padding(date.getMinutes()),
        ss:padding(date.getSeconds())
    };
    for (const key in config){
        format=format.replace(key,config[key]);
    }
    return format;
}

function padding(number){
    return number<10?"0"+number:number;
}

function IsFileSync(path) {
    try {
        let stat = fs.lstatSync(path)
        return stat.isFile()
    } catch (e) {
        return false;
    }
}

function IsDirectorySync(path) {
    try {
        let stat = fs.lstatSync(path)
        return stat.isDirectory()
    } catch (e) {
        return false;
    }
}

module.exports={
    dateFormat,
    IsDirectorySync,
    IsFileSync
}