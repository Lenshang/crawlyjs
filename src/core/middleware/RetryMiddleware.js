import Middleware from "../Middleware.js";
import Response from "../Response.js";

export default class extends Middleware{
    init(spider){
        this.default_retry_count=2;
        if(spider.custom_settings.RETRY_TIMES||spider.custom_settings.RETRY_TIMES==0){
            this.default_retry_count=spider.custom_settings.RETRY_TIMES;
        }
    }
    async process_request(request,spider){
        if(!request.meta._retry){
            request.meta._retry=0;
        }
        else{
            request.meta._retry+=1;
        }

        if(request.meta._retry<=this.default_retry_count){
            return request;
        }
        else{
            return null;
        }
    }
    async process_response(response,spider){
        return response;
    }
}