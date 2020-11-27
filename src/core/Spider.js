import async from 'async';
import Request from "./Request.js";
import Item from "./Item.js";
import AxiosMiddleware from "./middleware/AxiosMiddleware.js";
import RetryMiddleware from "./middleware/RetryMiddleware.js";
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
        this.task_queue = async.queue((task, callback)=>{
            if(task instanceof Request){
                task.execute(this.middlewares,this).then(response=>{
                    if(response instanceof Request){
                        _this._add_task(response);
                    }
                    else{
                        let iterator=task.callback.call(this,response);
                        let item=iterator.next();
                        while(!item.done){
                            _this._add_task(item.value);
                            item=iterator.next();
                        }
                    }
                    callback();
                });
            }
            else if(task instanceof Item){
                let _task=task;
                (async ()=>{
                    for(let pipeline of this.pipelines){
                        _task=await pipeline.process_item(_task,this);
                    }
                    callback();
                })();
            }
        }, this.custom_settings.MAXTHREAD);
    }
    *start_requests(){
        yield "A";
        yield "B";
        yield "C";
    }

    _add_task(item){
        this.task_queue.push(item)
    }

    async run(){
        this.init();
        let iterator=this.start_requests();
        let item=iterator.next();
        while(!item.done){
            this._add_task(item.value);
            item=iterator.next();
        }

        return new Promise((resolve,rejave)=>{
            this.task_queue.drain(()=>{
                resolve();
            });
        });
    }
}

