'use strict';

class controller{
    //用户指定的handlers
    #handlers

    //handler执行到了第几个
    #index

    //当前controller对应的request和response
    #request
    #response

    #map

    constructor(handlers,request,response) {
        this.#handlers=handlers;
        this.#index=-1;
        this.#request=request;
        this.#response=response;
    }

    abort(){
        //让index增大，会跳出next()中的循环
        this.#index = this.#handlers.length;
    }

    next(){
        this.#index++;
        while(this.#index<this.#handlers.length){
            this.#handlers[this.#index](this.#request,this.#response,this);
            this.#index++;
        }
    }

    set(key,val){
        if(this.#map===undefined) this.#map=new Map();
        this.#map.set(key,val);
    }

    get(key){
        return this.#map.get(key);
    }
}

module.exports={
    New(handlers,request,response){
        return new controller(handlers,request,response)
    }
}