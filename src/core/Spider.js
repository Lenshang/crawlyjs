import async from 'async';
import Request from "./Request.js";
import Item from "./Item.js";
import AxiosMiddleware from "./middleware/AxiosMiddleware.js";
import RequestPromiseMiddleWare from './middleware/RequestPromiseMiddleWare.js';
import RetryMiddleware from "./middleware/RetryMiddleware.js";
import log4js from 'log4js';
import AsyncLock from "async-lock";
import Thread from "../utils/thread.js";
export default class Spider{
    name=null;
    custom_settings=null;
    pipelines=[]
    middlewares=[]
    constructor(name=null,settings={}){
        if(name){
            this.name=name;
        }
        if(this.custom_settings==null){
            this.custom_settings=settings;
        }
        if(!this.custom_settings.MAXTHREAD){
            this.custom_settings.MAXTHREAD=3;
        }
        this.logger = log4js.getLogger(name);
        this.logger.level = "info";
        log4js.configure({
            appenders: { 'out': { type: 'stdout', layout: { type: 'basic' } } },
            categories: { default: { appenders: ['out'], level: 'info' } }
        });
        this.lock=new AsyncLock();
    }

    async init(){
        //初始化PIPELINE
        if(this.custom_settings.ITEM_PIPELINES){
            for(let Pipe of this.custom_settings.ITEM_PIPELINES){
                try{
                    let _pip=new Pipe();
                    await _pip.init();
                    this.pipelines.push(_pip);
                }
                catch(err){
                    this.logger.error(err);
                    process.exit();
                }
            }
        }

        //初始化MIDDLEWARE
        this.middlewares=[]
        if(this.custom_settings.MIDDLEWARES){
            for(let Mid of this.custom_settings.MIDDLEWARES){
                let mid=new Mid();
                await mid.init(this);
                this.middlewares.push(mid);
            }
        }
        if(this.custom_settings.RETRY_ENABLED!=false){
            let retry=new RetryMiddleware();
            retry.init(this);
            this.middlewares.push(retry);
        }
        // let axios=new AxiosMiddleware();
        // axios.init();
        // this.middlewares.push(axios);
        let rp=new RequestPromiseMiddleWare();
        rp.init();
        this.middlewares.push(rp);

        //初始化队列
        let _this=this;
        this.task_queue = async.queue(async (task, callback)=>{
            if(task instanceof Request){
                var response=await task.execute(this.middlewares,this);

                await this.lock.acquire("spider",async ()=>{
                    try{
                        if(response instanceof Request){
                            _this._add_task(response);
                        }
                        else if(!task.callback){
                            throw new Error("can not find callback method,please check your request!");
                        }
                        else{
                            let iterator=task.callback.call(_this,response);
                            let item=await iterator.next();
                            while(!item.done){
                                _this._add_first(item.value);
                                item=await iterator.next();
                            }
                        }
                        if(callback){
                            await callback();
                        }
                    }
                    catch(err){
                        this.logger.error(err);
                        process.exit();
                    }
                });
            }
            else if(task instanceof Item){
                let _task=task;
                for(let pipeline of this.pipelines){
                    let _pipline=async ()=>{
                        try{
                            _task=await pipeline.process_item(_task,this);
                        }
                        catch(err){
                            this.logger.error(err);
                            process.exit();
                        }
                    }
                    if(this.custom_settings.ASYNC_PIPELINE){
                        await _pipline();
                    }
                    else{
                        await this.lock.acquire("spider",async ()=>{
                            await _pipline();
                        });
                    }
                }
                if(callback){
                    await callback();
                }
            }
        }, this.custom_settings.MAXTHREAD);
    }
    *start_requests(){
        yield "A";
        yield "B";
        yield "C";
    }

    _add_task(item){
        this.task_queue.push(item);
    }
    _add_first(item){
        this.task_queue.unshift(item);
    }

    async run(){
        try{
            await this.init();
            let iterator=await this.start_requests();
            let item=await iterator.next();
            while(!item.done){
                // if(this.task_queue.length>this.custom_settings.MAXTHREAD){
                //     Thread.sleep(100);
                //     continue
                // }
                this._add_task(item.value);
                item=await iterator.next();
            }
        }
        catch(err){
            this.logger.error(err);
            process.exit();
        }

        return new Promise((resolve,rejave)=>{
            var _this=this;
            this.task_queue.drain(async ()=>{
                try{
                    for(let pipeline of this.pipelines){
                        await pipeline.on_close();
                    }
                    resolve();
                }
                catch(err){
                    this.logger.error(err);
                }
            });
        });
    }
}

