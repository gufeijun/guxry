'use strict';

const http = require('http');
const controller = require('./controller')
const enhancer = require('./enhancer')
const routergroup = require('./routergroup');
const utils = require('./utils')
const methodTree = require('./methodTree');

const logo = `   _____                               
  / ____|                              
 | |  __   _   _  __  __  _ __   _   _ 
 | | |_ | | | | | \\ \\/ / | |__| | | | |
 | |__| | | |_| |  >  <  | |    | |_| |
  \\_____|  \\____| /_/\\_\\ |_|     \\___ |
                                  __/ |
                                 |___/ `

//0为debug模式,1为release模式
let MODE = 0;

module.exports = {
    new: () => {
        return new engine();
    },
    default: () => {
        let r = new engine();
        if (MODE === 1 || process.env.GUXRY_MODE === "release") return r;
        r.use(new logger().GenMethodLogger());
        return r;
    },
    release: () => {
        MODE = 1;
    },
    debug: () => {
        MODE = 0;
    },
}

//路由模块
class engine {
    constructor() {
        this.#middlewares = [];
        this.#methodTrees = {
            "GET": methodTree.new("GET"),
            "POST": methodTree.new("POST"),
            "DELETE": methodTree.new("DELETE"),
            "PATCH": methodTree.new("PATCH"),
            "PUT": methodTree.new("PUT"),
            "OPTIONS": methodTree.new("OPTIONS"),
            "HEAD": methodTree.new("HEAD"),
            "CONNECT": methodTree.new("CONNECT"),
            "TRACE": methodTree.new("TRACE"),
        }
    };

    //http 9种方法，对应9个树
    #methodTrees
    //注册的中间件
    #middlewares;
    listeningAddr;

    static(relativePath, root) {
        if (!utils.IsDirectorySync(root)) {
            console.log(`路径${root}不存在`);
            process.exit(1);
        }
        let s = function (req, res) {
            let filepath = root + req.param("*");
            res.sendFile(filepath);
        }
        if(MODE === 1 || process.env.GUXRY_MODE === "release")
        this.#methodTrees["GET"].insert(relativePath + "/*", [s])
        else this.#methodTrees["GET"].insert(relativePath + "/*", [new logger(root).GenFileLogger(),s ])
    }

    get(path, ...handleFunc) {
        this.#methodTrees["GET"].insert(path, this._pack(handleFunc));
        return this;
    };

    post(path, ...handleFunc) {
        this.#methodTrees["POST"].insert(path, this._pack(handleFunc));
        return this;
    };

    delete(path, ...handleFunc) {
        this.#methodTrees["DELETE"].insert(path, this._pack(handleFunc));
        return this;
    };

    patch(path, ...handleFunc) {
        this.#methodTrees["PATCH"].insert(path, this._pack(handleFunc));
        return this;
    };

    put(path, ...handleFunc) {
        this.#methodTrees["PUT"].insert(path, this._pack(handleFunc));
        return this;
    };

    options(path, ...handleFunc) {
        this.#methodTrees["OPTIONS"].insert(path, this._pack(handleFunc));
        return this;
    };

    head(path, ...handleFunc) {
        this.#methodTrees["HEAD"].insert(path, this._pack(handleFunc));
        return this;
    };

    connect(path, ...handleFunc) {
        this.#methodTrees["CONNECT"].insert(path, this._pack(handleFunc));
        return this;
    };

    trace(path, ...handleFunc) {
        this.#methodTrees["TRACE"].insert(path, this._pack(handleFunc));
        return this;
    };

    any(path, ...handleFunc) {
        for (let method of ["GET", "POST", "DELETE", "PATCH", "PUT", "OPTIONS", "HEAD", "CONNECT", "TRACE"]) {
            this.#methodTrees[method].insert(path, this._pack(handleFunc));
        }
        return this;
    }

    run(IPAddr) {
        let This = this;
        let s = this._initServer()
        let [addr, port] = this._parseIPAddr(IPAddr);
        this.listeningAddr = addr + ":" + port;

        try {
            s.listen(port, addr, function (err) {
                if (err != null) {
                    throw err;
                }
                if (MODE === 0) return This._log();
            });
        } catch (e) {
            console.log(`\x1B[33m[Core-Warning]\x1b[0m \x1B[31mFailed\x1B[0m to start the HTTP server\n`)
            console.log(e);
        }
    };

    group(path) {
        return routergroup.New(this, path);
    };

    //使用中间件
    use(...middlewares) {
        this.#middlewares = [...this.#middlewares, ...middlewares];
    };

    _pack(handleFunc) {
        return [...this.#middlewares, ...handleFunc];
    };

    _initServer() {
        let server = http.createServer();
        let This = this;
        let callback = function (request, response) {
            if (request.url === '/favicon.ico') return;
            enhancer.enhance(request, response);

            //从对应的method前缀树中取出对应的处理函数
            let [handlers, parameter] = This.#methodTrees[request.method].fetch(request.pathname);
            if (handlers == null) return response.end();
            request.parameter = parameter;
            request.param = function (key) {
                return this.parameter[key];
            }

            let ctrl = controller.New(handlers, request, response);
            ctrl.next();
        };
        server.addListener("request", callback);
        return server;
    };

    _parseIPAddr(IPAddr) {
        //如果为 :80 这样的省略ip的地址，则默认监听地址为127.0.0.1
        if (IPAddr[0] === ":") {
            return ["127.0.0.1", Number(IPAddr.slice(1))];
        }
        let index = IPAddr.indexOf(":");
        //如果未写端口，则默认监听80端口
        return index === -1 ? [IPAddr, 80] : [IPAddr.slice(0, index), Number(IPAddr.slice(index + 1, IPAddr.length))];
    };

    _log() {
        console.log(logo)
        console.log('\n\x1B[33m[Core-debug]\x1b[0m \x1b[31m[WARNING] \x1b[0mCreating an Engine instance with the Logger middleware already attached.')
        console.log('\n\x1B[33m[Core-debug]\x1b[0m \x1b[31m[WARNING] \x1b[0mRunning in "\x1b[31mdebug\x1b[0m" mode. Should switch to "\x1b[31mrelease\x1b[0m" mode in production.')
        console.log(' - using code:   guxry.release()');
        console.log(' - using env:    export GUXRY_MODE=release\n');
        console.log(`\x1B[33m[Core-debug]\x1b[0m Listening and serving HTTP \x1B[32msuccessfully\x1B[0m on ${this.listeningAddr}. Waiting for clients: \x1b[36m \x1b[0m\n`)
    }
}


class logger{
    constructor(root) {
        this.root=root;
    }
    GenMethodLogger(){
        return function (request, response, controller) {
            let begin = new Date().getTime();
            controller.next();
            let now = new Date().getTime();
            let since = (now - begin) + 'ms';
            since.padEnd(8, ' ');
            let remoteAddr = request.connection.remoteAddress + ":" + request.connection.remotePort;
            let m= `[${request.method}]`.padEnd(10," ")
            console.log(`\x1b[32m${m}\x1b[0m  ${utils.dateFormat()}   ${remoteAddr}` +
                `    \x1b[34m${since}\x1b[0m       \x1b[35m${request.url} \x1b[0m`)
        }
    }
    GenFileLogger(){
        let rootPath = this.root;
        return  function (request, response, controller)  {
            if (!utils.IsFileSync(rootPath + request.param("*"))) return controller.abort();
            let begin = new Date().getTime();
            controller.next();
            let now = new Date().getTime();
            let since = (now - begin) + 'ms';
            since.padEnd(8, ' ');
            let remoteAddr = request.connection.remoteAddress + ":" + request.connection.remotePort;
            let m = `[FILE]`.padEnd(10," ");
            console.log(`\x1b[32m${m}\x1b[0m  ${utils.dateFormat()}   ${remoteAddr}` +
                `    \x1b[34m${since}\x1b[0m       \x1b[35m${request.url} \x1b[0m`)
        }
    }
}
