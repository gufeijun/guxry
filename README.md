## 1. 介绍

#### 1.1 简介

guxry框架是一个轻量http框架，借鉴go语言gin框架，支持restful风格，不依赖任何第三方库，总共代码不超过1000行，轻量高效率。作者为***，给雄哥所写。

#### 1.2 功能

+ 完善的restful风格API，通过`GET`、`POST`、`DELETE`等方法绑定API，充分解耦代码。
+ 易于理解的中间件机制，以及完善的中间件执行流程机制。
+ 完善的`debug`模式，更好帮助调试代码，定位bug。
+ 支持**动态路由**，且动态路由的实现利用前缀树，执行效率极高。
+ 支持路由组，更好的分层项目架构，使业务逻辑更清晰。
+ 一键开放静态文件，轻松打造网路文件系统。
+ 完全保留了nodejs原生request和response的API的内容，在此基础上进行的一定扩展。

#### 1.3 改进

框架未集成`form`表单功能，使用者应该利用`formidable`或者其他库进行一个集成。

框架未集成`template`渲染功能，推荐使用`art-template`或其他库。

#### 1.4 安装

```shell
npm install guxry --save
```

#### 1.5 第一个示例

```js
const guxry = require('guxry');

let engine = guxry.default();

engine.get("/hello",function (req,res){
    res.sendJson({
        "message":"Hello,World!"
    })
})

engine.run("127.0.0.1")
```

将上述代码保存并执行，浏览器打开`127.0.0.1/hello`就能看到一串**JSON**字符串。

#### 1.6 RESTful API

REST与技术无关，代表的是一种软件架构风格，REST是Representational State Transfer的简称，中文翻译为“表征状态转移”或“表现层状态转化”。

推荐阅读[阮一峰 理解RESTful架构](http://www.ruanyifeng.com/blog/2011/09/restful.html)。

简单来说，REST的含义就是客户端与Web服务器之间进行交互的时候，使用HTTP协议中的4个请求方法代表不同的动作。

- `GET`用来获取资源
- `POST`用来新建资源
- `PUT`用来更新资源
- `DELETE`用来删除资源。

只要API程序遵循了REST风格，那就可以称其为RESTful API。目前在前后端分离的架构中，前后端基本都是通过RESTful API来进行交互。

例如，我们现在要编写一个管理书籍的系统，我们可以查询对一本书进行查询、创建、更新和删除等操作，我们在编写程序的时候就要设计客户端浏览器与我们Web服务端交互的方式和路径。按照经验我们通常会设计成如下模式：

| 请求方法 |     URL      |     含义     |
| :------: | :----------: | :----------: |
|   GET    |    /book     | 查询书籍信息 |
|   POST   | /create_book | 创建书籍记录 |
|   POST   | /update_book | 更新书籍信息 |
|   POST   | /delete_book | 删除书籍信息 |

同样的需求我们按照RESTful API设计如下：

| 请求方法 |  URL  |     含义     |
| :------: | :---: | :----------: |
|   GET    | /book | 查询书籍信息 |
|   POST   | /book | 创建书籍记录 |
|   PUT    | /book | 更新书籍信息 |
|  DELETE  | /book | 删除书籍信息 |

`guxry`支持RESTful API开发。

```js
const guxry = require('guxry');

let engine = guxry.default();
engine.get("/book",function (req,res){
    res.sendJson({
        "message":"GET"
    })
})

engine.post("/book",function (req,res){
    res.sendJson({
        "message":"POST"
    })
})

engine.put("/book",function (req,res){
    res.sendJson({
        "message":"PUT"
    })
})

engine.delete("/book",function (req,res){
    res.sendJson({
        "message":"DELETE"
    })
})

engine.run("127.0.0.1")
```

开发RESTful API的时候我们通常使用[Postman](https://www.getpostman.com/)来作为客户端的测试工具。

## 2. 使用说明

### 2.1 绑定路由

让我们看看最传统的nodejs标准库的HTTP服务器写法：

```js
const http = require("http");

let server = http.createServer();
server.addListener("request",function (request,response){
    switch (request.url){
        case "/book":
            if(request.method=="GET"){
                //do something
            }else if(request=="POST"){
                //do something
            }else if(request=="DELETE"){
                //do something
            }
        case "/user":
            //do something
        case "/video":
            //do something
    }
    response.end();
})

server.listen(80,"127.0.0.1");
```

你会发现，上述每来一个请求，你需要自己判断用户的提交的URL或者方法是否为自己想要，所有的处理方法耦合在一个函数里，极不利于项目维护和拓展。

`guxry`在标准库基础上进行了封装，利用事件驱动模式来开发。即来一个类型的请求就对应用一种处理方法来进行处理。`guxry`完全遵循RESTful的标准，将一个url和一个method形成的组合称为一个请求类型。例如`GET:/book`、`POST:/book`和`GET:/book/photo`为三种不同的请求类型，用户只需指明每个类型的回调处理函数，guxry就会自动用这些函数去处理。那么如何绑定？可以看下面的例子。

#### 2.1.1 静态路由

静态两字如何理解，可以和动态路由对比，这里先不解释。

```js
const guxry = require('guxry');

//guxry.default()会返回一个engine类，通过engine类的方法，可以完成绑定api的工作
//也可以利用guxry.new()一样会返回一个engine，但与default不同的是，new()生成的engine实例不会包含logger中间件，这个中间件会在终端输出客户端的请求信息，帮助调试。
//但再生产环境中请使用guxry.new()，因为中间件会造成一定的性能损耗。
let engine = guxry.default();

//为get:/book/photo这样的请求绑定一个函数，浏览器访问127.0.0.1:8080/book/photo就会触发这个处理函数
engine.get("/book/photo",function (req,res,ctrl){
    res.sendText("Hello,World!");
})

engine.run("127.0.0.1:8080")
```

上述除了可以`engine.get`之外，`guxry`还支持另外8种HTTP方法。如：post,delete,put,head等。注意的是还支持一个any方法，它并不是HTTP的方法，使用any绑定处理函数时，会将所有的HTTP方法绑定这个函数。

`get`函数的第二个参数是一个回调函数，只要用户提交一个HTTPmethod为**GET**且路径为**/**的请求，就会执行这个回调函数。

回调函数提供了三个可选参数，`request`、`response`和`controller`：

+ request中包含了用户请求的一些信息，guxry的request完全兼容nodejs标准库的request，完全可以用nodejs标准库的操作来使用这个request，当然guxry在此基础上做了延申，稍后提到。
+ response中包含了用于服务端给用户传递信息的操作，同样兼容nodejs标准库，并做了些延申。
+ controller是guxry独有，包含了一些流程控制操作。

回调函数中做了个很简单的操作，即向前端发送一个简单的文本。

最后`engine.run`即在127.0.0.1:8080开始运行，不写端口后则默认在80端口运行。

#### 2.1.2 动态路由

上述静态路由有个缺陷，即用户请求的路径必须精准匹配`/book/photo`才能触发处理函数，现实运用中肯定有时后我们希望可以进行一种模糊的匹配，这种就是动态路由。比如我们想设计一个路由：`/user/(用户id)/photo`，括号内为模糊匹配，只要满足`/user`以及`/photo`，中间为任意都可以匹配成功。例如用户A的ID为**1**的url为`/user/1/photo`，用户B的ID为**2**的url为`/user/2/photo`就能匹配。这样的需求又如何实现呢？

看以下例子：

```js
engine.get("/user/:id/photo",function (req,res,ctrl){
  	//通过req.param("id")就可以查看用户的id
    console.log(req.param("id"));
})
//浏览器访问/user/1/photo，则程序会输出1。
```

guxry还支持另一种匹配即全配符`*`匹配，`guxry`的文件服务器插件就是用的这种方式：

```js
engine.get("/video/*",function (req){
    console.log(req.param("*"))
})
```

只要访问的路径中以`/video/`前缀，则都会走这条路由。注意：这个路由不会匹配`/video`

### 2.2 中间件

中间件机制可以帮助你很方便的优化代码逻辑。一个中间件专门专注一件事，可以是日志的收集，可以是cookie的判断，都可以帮助代码解耦。

#### 2.2.1 基础使用

```js
const guxry = require('guxry');

let engine = guxry.default();

//绑定了两个处理函数，LogCollect就可以看成中间件
engine.get("/index1",LogCollect,Hello1);

engine.get("/index2",LogCollect,Hello2)

function LogCollect(req,res){
    console.log("中间件开始日志收集")
    //...
    //做日志收集操作
}

function Hello1(req,res){
    res.sendText("你好1!");
}

function Hello2(req,res){
    res.sendText("你好2!");
}

engine.run("127.0.0.1")
```

也可以这样：

```js
//为所有由engine注册的路由注册中间件
engine.use(LogCollect);

engine.get("/index1",Hello1);

engine.get("/index2",Hello2)

function LogCollect(req,res){
    console.log("中间件开始日志收集")
    //做日志收集操作
}

function Hello1(req,res){
    res.sendText("你好1!");
}

function Hello2(req,res){
    res.sendText("你好2!");
}
```

可以发现，guxry和传统框架不同的一点是，一个请求类型可以绑定不限数量的处理方法，这些处理方法会一个一个线性的执行，直至所有处理函数执行完。

如果这些处理函数移至保持线性执行的话，其实不够灵活，就有没有一种方法可以提前终止，或者先执行后续的函数呢？

#### 2.2.2 abort()

假设有这个场景：你写的每个api函数中，在开始时都会检查用户请求中的`cookie`来判断用户是否登录，未登录一并拒绝请求。传统情况下，你可能在每个api函数中都加上这样一段判断代码，这样公共的操作或者和业务无太多关系的操作完全可以利用一个中间件进行一个拦截。guxry的中间件机制十分灵活：

```js
const guxry = require('guxry');

let engine = guxry.default();

//一个请求类型可以绑定多个处理函数
engine.get("/index",checkCookie,doSomething)

function doSomething(req,res,ctrl){
    //真正的业务代码
}

//checkCookie就可以当一个中间件
function checkCookie(req,res,ctrl){
    let user = req.cookie("name");
    let password = req.cookie("password");
    //通过username和password查询数据库进行验证
    //...
    if(验证失败){
        //ctrl.abort()会停止后续处理函数的执行
        ctrl.abort();
        return;
    }
    //验证成功
    //到这里当前这个处理函数已经处理完了，接着会执行后续的doSomething处理方法        
}

engine.run("127.0.0.1")
```

就拿上例，会先执行`checkCookie`然后执行`doSomething`，`checkCookie`是可以做cookie检验操作。

如果验证不成功，`ctrl.abort()`会阻止后续处理函数的运行，但注意当前函数函数不会立马退出，会继续执行当前中间件后续的步骤，如果想abort后立马退出当前函数请不要忘了return。

#### 2.2.3 next()

abort是提前结束，next是暂时先执行后续的处理函数，执行完后才执行当前函数剩下的内容。

```js
const guxry = require('guxry');

let engine = guxry.default();

engine.get("/",A,B,C,D)

function A(req,res,ctrl){
    ctrl.next();
    console.log("A")
}

function B(){
    console.log("B")
}

function C(req,res,ctrl){
    ctrl.next()
    console.log("C")
}

function D(){
    console.log("D")
}

engine.run("127.0.0.1")
```

上述结果输出为B、D、C、A。

你可能会觉得这个没什么太大意义，用处不大，但某些中间件，如统计整个请求过程用了多少时间，这回非常有用。guxry的logger中间件就是基于next。

#### 2.2.4 中间件间数据传递

假设现在写了一个中间件用来检验用户cookie，只有通过数据库验证通过后才能执行后续的处理函数，后续的处理函数是根据用户的ID查询数据库把用户的信息返回前端。

很明显的是，不论是前面的中间件还是后面的处理函数都需要查询数据库，前面用来检测用户的username和password是否正确，后面通过用户的username查询用户的信息。如果你傻乎乎的去查询两次，则会给数据库增加一些不必要的负担，时刻记住IO操作是做大的性能瓶颈。那么就应该有一种在这些链式调用的处理函数中进行参数传递的操作。

```js
const guxry = require('guxry');

let engine = guxry.default();

engine.get("/",checkCookie,doSomething)

function doSomething(req,res,ctrl){
    let user = ctrl.get("user");
    //do other things
}

function checkCookie(req,res,ctrl){
    let username = req.cookie("username");
    let password = req.cookie("password");
    //查询数据库...
    let user = //通过查询结果实例化一个对象
    if(user.password!==password){
        ctrl.abort();
        return;
    }
    //通过ctrl.set()方法存储user
    ctrl.set("user",user);
}

engine.run("127.0.0.1")
```

### 2.3 静态文件

web服务器避免不了的是传递一些Html、css、js文件到前端，应该有有效的工具进行管理。

```js
engine.static("/fileserver","./static")
```

后一个参数是指你想要公开的文件夹的物理路径(即本机文件路径)，这样该文件夹下的所有文件都可以通过网络访问。

前一个参数是实际通过网络访问时的相对路径，即url路径。

因此，如果你的服务器在当前目录下static文件夹下有一个index.html的文件，用户则可以通过url为`127.0.0.1/fileserver/index.html`访问。

### 2.4 获取参数

#### 2.4.1 cookie

```js
const guxry = require('guxry');

let engine = guxry.default();

engine.get("/",function (req,res){
    //key为你想要获取cookie的名称
    //如果拿不到就是undefined
    console.log(req.cookie("key"))
    //不传的话是所有cookie key-value组成的对象
    console.log(req.cookie())
    //设置cookie
    //function (name, value, path, domain, maxAge, httpOnly = true)
    res.setCookie("age","10","/","127.0.0.1",1000);
})

engine.run("127.0.0.1")
```

setCookie中的诸多参数请自行了解cookie的规则，着重讲下maxAge。

+ maxAge>0，则maxAge秒后，用户浏览器会将让这个cookie失效。
+ maxAge=0，表示永不失效，但浏览器关闭时会删除。
+ maxAge<0，浏览器会立马删除这个cookie name对应的cookie。

#### 2.4.2 queryString

url会包含query字段，如127.0.01/?age=10&&name=xiong，服务器该怎么拿到这些信息呢？

```js
engine.get("/",function (req,res){
    //如果拿不到则返回undefined
    let age=req.query("age")
    console.log(age)
})
```

#### 2.4.3 form

请自行使用formidable或其他框架。

### 2.5 路由组

guxry提供了路由分组功能。比如和`user`相关的的路由归为一组，将与`video`相关的路由分为一组等等，这样分组有助于组织代码以及多人合作分工。看以下例子：

```js
const guxry = require('guxry');

let engine = guxry.default();

let userGroup  = engine.group("/user");
{
    //访问127.0.0.1/user/login
    userGroup.get("/login",function (){})
    userGroup.post("/login",function (){})
    //...
    //你甚至可以嵌套
    let infoGroup = userGroup.group("/info");
    //访问127.0.0.1/user/info/name
    infoGroup.get("/name",function (){})
}

let videoGroup =engine.group("/video");
{
    //访问127.0.0.1/video/comment
    videoGroup.get("/comment",function (){});
    videoGroup.post("/comment",function (){});
    //...
}

engine.run(":80")
```

routerGroup可以进行无线嵌套，只要你愿意。但值得注意的是，由父亲衍生出来的routerGroup会继承父亲的所有中间件。

### 2.6 与客户端交互

再次强调，guxry保留了nodejs原生api的所有写法，这里只介绍新增的一些很方便的api。

> 设置状态码

```js
engine.get("/",function (req,res){
    res.setStatusCode(200).sendText("你好");
    //也可以这样 res.sendText("你好",200)
    //第二个参数可选，默认为200
})
```

> 发送文本

```js
engine.get("/",function(req,res){
    res.sendText("dad")
})
```

> 发送html

```js
engine.get("/",function (req,res){
    let html = fs.readFileSync("static/test.html");
    res.sendHtml(html,200);
})
```

> 发送JSON

与客户端交互使用最多的是`JSON`格式

```js
engine.get("/",function(req,res){
    res.sendJson({
        status:0,
    },200)
})
```

> 设置cookie

```js
//function setCookie(name, value, path, domain, maxAge, httpOnly = true)
engine.get("/",function(req,res){
    //请自行了解cookie规范
    res.setCookie("uuid","dfskhgflkklvas","/","127.0.0.1",200)
}
```

setCookie中的诸多参数请自行了解cookie的规则，着重讲下maxAge。

+ maxAge>0，则maxAge秒后，用户浏览器会将让这个cookie失效。
+ maxAge=0，浏览器关闭时会删除这个cookie。
+ maxAge<0，会立马删除这个cookie name对应的cookie。

> 重定向

```js
engine.get("/",function(req,res){
    res.redirect("http://www.baidu.com",302);
})
```
### 2.7 对于异步请求

框架会子哦对那个帮助调用res.end()，但这样对于异步请求并不适用，可以使用res.halt()来取消框架的自动调用

```js
engine.post("/login",function(req,res){
    res.halt();
    let form = new formiddable.IncomingForm();
    form.parse(req,function(err,fields,files){
        
        console.log(fields);
        res.sendJson({
            status:0,
        })
        res.end();
    })
})
```

