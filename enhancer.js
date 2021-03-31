'use strict'
const fs = require('fs');
const utils = require("./utils.js")

function enhance(request, response) {
    enhanceRequest(request);
    enhanceResponse(response);
}

function enhanceRequest(request) {
    let url = new URL('http://' + request.headers.host + request.url);
    //添加属性
    request.queryobj = url.searchParams;
    request.pathname = url.pathname;

    //添加方法
    //查询用户访问url的queryString
    request.query = key => {
        return request.queryobj.get(key);
    }

    //查询用户HTTP请求中的cookie
    request.cookie = key => {
        if (request.cookieObj !== undefined) return request.cookieObj[key];
        let cookieStr = request.headers.cookie;
        let cookieObj = {};
        if (cookieStr === undefined) return undefined;
        cookieStr.split(';').forEach(item => {
            if (!item) return;
            item = item.trim()

            let kv = item.split("=");
            cookieObj[kv[0]] = kv[1];
        })
        request.cookieObj = cookieObj;
        return cookieObj[key];
    }
}

function enhanceResponse(response) {
    //给response新增属性
    response.cookieJar = [];
    //给response新增方法
    response.setStatusCode = function (statusCode) {
        this.statusCode = statusCode;
        return response;
    }
    response.sendText = function (msg, statusCode = 200) {
        this.setHeader("Content-Type", "text/plain;charset=utf-8");
        this.setStatusCode(statusCode);
        this.write(msg);
    }
    response.sendHtml = function (msg, statusCode = 200) {
        this.setHeader("Content-Type", "text/html;charset=utf-8");
        this.setStatusCode(statusCode);
        this.write(msg);
    }
    response.sendJson = function (obj, statusCode = 200) {
        if (!(typeof obj === "string")) obj = JSON.stringify(obj);
        this.setHeader("Content-Type", "application/json;charset=utf-8")
        this.setStatusCode(statusCode);
        this.write(obj);
    }
    response.sendFile = function (filepath, statusCode = 200) {
        if(!utils.IsFileSync(filepath))  {
            this.setStatusCode(404);
            return;
        }
        this.setStatusCode(statusCode);
        let data = fs.readFileSync(filepath)
        this.write(data);
    }
    response.setCookie = function (name, value, path, domain, maxAge, httpOnly = true) {
        let c = new cookie(name, value, path, domain, maxAge, httpOnly);
        this.cookieJar.push(c.toString());
        this.setHeader("Set-Cookie", this.cookieJar)
    }
    //重定向
    response.redirect = function (location,statusCode=302) {
        response.setStatusCode(statusCode);
        response.setHeader("Location",location);
    }
    response.halt = function(){
        response.halted = true;
    }
}

class cookie {
    //maxAge以秒为单位
    constructor(name, value, path, domain, maxAge, httponly) {
        [this.Name, this.Value, this.Path, this.Domain, this.MaxAge, this.HttpOnly] =
            [name, value, path, domain, maxAge, httponly.toString()];
    }
    Name
    Value
    Path    //optional
    Domain  //optional
    Expires //过期时间

    //MaxAge>0 表示设置多长时间过期
    //MaxAge=0 表示cookie的生命周期仅为浏览器运行这段时间，浏览器关闭，会自动删除cookie
    //MaxAge<0 表示立马删除这个cookie
    MaxAge
    HttpOnly

    toString() {
        if (this.Name === "" || this.Name === undefined) {
            return "";
        }
        let str = `${this.Name}=${this.Value}; `;
        if (this.Path !== undefined && this.Path !== "") {
            str += `Path=${this.Path}; `
        }
        if (this.Expires !== undefined) {
            str += `Expires=${this.Expires}; `
        }
        if (this.Domain !== undefined && this.Domain !== "") {
            str += `Domain=${this.Domain}; `;
        }
        if (this.MaxAge !== undefined && this.MaxAge !== 0) {
            str += `Max-Age=${Number(this.MaxAge)}; `;
        }
        if (this.HttpOnly !== undefined && this.HttpOnly) {
            str += `HttpOnly=${this.HttpOnly}`;
        }
        return str;
    }
}

module.exports = {
    enhance
}