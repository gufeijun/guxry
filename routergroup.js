//一个router可以衍生多个routergroup。
class RouterGroup{
    #router
    #path
    #middlewares
    constructor(router,path,middlewares) {
        this.#router=router;
        this.#path= path;
        if(middlewares===undefined) this.#middlewares=[];
        else this.#middlewares=middlewares;
    }
    group(prefix){
        return new RouterGroup(this.#router,this.#path+prefix,this.#middlewares);
    }
    get(relativepath,...handleFunc){
        this.#router.get(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    post(relativepath,...handleFunc){
        this.#router.post(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    delete(relativepath,...handleFunc){
        this.#router.delete(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    patch(relativepath,...handleFunc){
        this.#router.patch(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    put(relativepath,...handleFunc){
        this.#router.put(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    options(relativepath,...handleFunc){
        this.#router.options(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    head(relativepath,...handleFunc){
        this.#router.head(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    connect(relativepath,...handleFunc){
        this.#router.connect(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    trace(relativepath,...handleFunc){
        this.#router.trace(this.#path+relativepath,...this._pack(handleFunc));
        return this;
    }
    any(relativepath,...handleFunc){
        this.#router.any(this.#path+relativepath,...this._pack(handleFunc))
        return this;
    }
    use(...middlewares){
        this.#middlewares=[...this.#middlewares,...middlewares];
    }
    _pack(handleFuncs){
        return [...this.#middlewares,...handleFuncs];
    }
}

module.exports={
    New(router,path){
        return new RouterGroup(router,path);
    }
}