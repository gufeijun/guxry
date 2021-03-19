'use strict';

class methodTree {
    constructor(method) {
        this.method = method;
        this.routerCount = 0;
        this.root = new node("");
    }

    //这个Tree对应的方法
    method
    //root头节点，实际不存储值，起索引，类似单链表头节点
    root

    //将路由插入methodTree中
    insert(solidPath, handleFuncs) {
        //将solidPath分割为relativePath数组，如将'/user/video/name'分割为['/user','/video','/name']
        let pathArray = toPathArray(solidPath);
        panicIfErr(pathArray,solidPath);

        //将path数组建立成相应的node数组
        let nodeArray = toNodeArray(pathArray, handleFuncs);
        let root = this.root;

        for (let node of nodeArray) {
            try {
                IsValidate(root, node);
            } catch (err) {
                console.log(err);
                process.exit(1);
            }
            let index = IndexOfNode(root.children, node);
            if (index === -1) {
                //如果不存在，则插入
                root.children.push(node);
                let p = node.relativePath;
                if (p.includes(":") || p.includes("*")) root.IsChildrenD = true;
                root = node;
            } else {
                //如果存在继续向下索引
                root = root.children[index];
            }
        }
    }

    //根据前缀树中取出handleFuncs
    fetch(solidPath) {
        let root = this.root;
        let parameter = {};
        let pathArray = toPathArray(solidPath);
        for (let i = 0; i < pathArray.length; i++) {
            if (root.children == null) return [null, null];
            let children = root.children;
            //root的孩子节点是动态路径时
            if (root.IsChildrenD) {
                let child = children[0];
                if (child.relativePath === "/*") {
                    parameter["*"] = pathArray.slice(i).join("");
                    return [child.handleFuncs, parameter];
                }
                parameter[child.relativePath.slice(2)] = pathArray[i].slice(1);
                root = child;
                continue;
            }
            //root的孩子节点是绝对路径时，遍历所有孩子，找到匹配的路径
            let flag = 0;
            for (let child of children) {
                if (child.relativePath === pathArray[i]) {
                    root = child;
                    flag = 1;
                    break;
                }
            }
            //找不到直接退出
            if (flag === 0) return [null, null];
        }
        return [root.handleFuncs, parameter];
    }
}

function IsValidate(root, toInsert) {
    let children = root.children;
    //子节点中要么全是静态路径，要么只有一个动态路径
    if (root.IsChildrenD) {
        if (toInsert.relativePath !== children[0].relativePath) throw new Error(toInsert.relativePath + " conflict with " + children[0].relativePath);
        return;
    }
    let ok = toInsert.relativePath.includes(":") || toInsert.relativePath.includes("*");
    if (ok && root.children.length > 0) {
        let ErrMsg = "";
        root.children.forEach(function (val, index) {
            ErrMsg += val.relativePath;
            if (index !== root.children.length - 1) {
                ErrMsg += " | ";
            }
        })
        throw new Error(toInsert.relativePath + " conflict with " + ErrMsg);
    }
}

function IndexOfNode(children, node) {
    for (let i = 0; i < children.length; i++) {
        if (node.relativePath === children[i].relativePath) {
            return i;
        }
    }
    return -1;
}

class node {
    constructor(relativePath, handleFuncs = null) {
        this.handleFuncs = handleFuncs;
        this.relativePath = relativePath;
        this.children = [];
        this.IsChildrenD = false;
    }

    //该节点中存储的handleFuncs
    handleFuncs
    //节点对应的路径，为完整路径的一部分
    //对应如/user/video/name中一截如/video
    relativePath
    //children是一个节点数组
    children
    //孩子中是否存在动态路径
    IsChildrenD
}

//按‘/’将路径分割
function toPathArray(str) {
    if (str[0] !== "/") {
        return null;
    }
    if (str.length === 1) return ['/'];
    let from = 0;
    let array = [];
    for (let i = 1; i < str.length; i++) {
        if (str[i] === "/") {
            if (i === from + 1) return null;
            array.push(str.slice(from, i));
            from = i;
        }
    }
    array.push(str.slice(from))
    return array;
}

function toNodeArray(pathArray, handleFuncs) {
    let NodeArray = [];
    pathArray.forEach(function (path) {
        let Node = new node(path);
        NodeArray.push(Node);
    });
    let lastNode = NodeArray[NodeArray.length - 1];
    lastNode.handleFuncs = handleFuncs;
    return NodeArray;
}

function panicIfErr(pathArray,solidPath){
    if (pathArray == null) {
        console.log("invalid api path: ", solidPath);
        process.exit(1);
    }
    //全路径中只允许最后为*，即/user/*/video这样的api不合法
    for (let i = 0; i < pathArray.length - 1; i++) if (pathArray[i].includes("*")) {
        console.log(`'*' can not exist in the middle of ${solidPath}`);
        process.exit(1)
    }
    let last = pathArray[pathArray.length - 1];
    if (last.includes("*") && last !== "/*") {
        console.log("invalid api path: " + last);
        process.exit(1);
    }
}

module.exports = {
    new: (method) => {
        return new methodTree(method);
    }
}