import async from 'async';
import Request from "./Request.js";
import Item from "./Item.js";
import AxiosMiddleware from "./middleware/AxiosMiddleware.js";
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

    init(){
        //初始化PIPELINE
        if(this.custom_settings.ITEM_PIPELINES){
            for(let Pipe of this.custom_settings.ITEM_PIPELINES){
                this.pipelines.push(new Pipe());
            }
        }

        //初始化MIDDLEWARE
        this.middlewares=[]
        if(this.custom_settings.MIDDLEWARES){
            for(let Mid of this.custom_settings.MIDDLEWARES){
                let mid=new Mid();
                mid.init(this);
                this.middlewares.push(mid);
            }
        }
        if(this.custom_settings.RETRY_ENABLED!=false){
            let retry=new RetryMiddleware();
            retry.init(this);
            this.middlewares.push(retry);
        }
        let axios=new AxiosMiddleware();
        axios.init();
        this.middlewares.push(axios);


        //初始化队列
        let _this=this;
        this.task_queue = async.queue(async (task, callback)=>{
            if(task instanceof Request){
                var response=await task.execute(this.middlewares,this);

                await this.lock.acquire("spider",async ()=>{
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
                    await callback();
                });
            }
            else if(task instanceof Item){
                let _task=task;
                for(let pipeline of this.pipelines){
                    let _pipline=async ()=>{
                        if(!pipeline.isInit){
                            await pipeline.init(this);
                            pipeline.isInit=true;
                        }
                        _task=await pipeline.process_item(_task,this);
                    }
                    if(!pipeline.isAsync){
                        await this.lock.acquire("spider",async ()=>{
                            await _pipline();
                        });
                    }
                    else{
                        await _pipline();
                    }

                }
                await this.lock.acquire("spider",async ()=>{
                    await callback();
                });
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
        this.init();
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

        return new Promise((resolve,rejave)=>{
            var _this=this;
            this.task_queue.drain(async ()=>{
                for(let pipeline of this.pipelines){
                    await pipeline.on_close();
                }
                resolve();
            });
        });
    }
}

