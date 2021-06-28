import axios from "axios";
import Response from "./Response.js";
export default class Request{
    constructor(option){
        this.url=option.url;
        this.params=option.params;
        this.method=option.method;
        this.callback=option.callback;
        this.headers=option.headers;
        this.meta=option.meta;
        this.data=option.data;
        this.body=option.body;
        if(!this.meta){
            this.meta={};
        }
    }

    async execute(middlewares,spider){
        let item=this;
        let pcs_req=[];
        let pcs_resp=[];
        for(let mid of middlewares){
            if(mid.process_request){
                pcs_req.push([mid.process_request,mid]);
            }
            if(mid.process_response){
                pcs_resp.push([mid.process_response,mid]);
            }
        }

        for(let req of pcs_req){
            try{
                item=await req[0].call(req[1],item,spider);
            }
            catch(err){
                spider.logger.error(err);
            }
            if(item instanceof Response){
                break;
            }
            else if(item instanceof Request){
                continue;
            }
            else{
                return null;
            }
        }

        if(item instanceof Request){
            return item;
        }

        for(let resp of pcs_resp){
            item=await resp[0].call(resp[1],item,spider);
            if(item instanceof Request){
                return item;
            }
            else if(item instanceof Response){
                continue;
            }
            else{
                return null;
            }
        }

        return item;
    }
}