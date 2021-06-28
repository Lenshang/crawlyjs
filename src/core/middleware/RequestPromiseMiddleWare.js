import Middleware from "../Middleware.js";
import Response from "../Response.js";
import rp from "request-promise";
export default class extends Middleware{
    async process_request(request,spider){
        try{
            let option={
                url:request.url,
                method:request.method,
                headers:request.headers,
                resolveWithFullResponse:true
            }
            if(request.data){
                option.data=request.data;
            }
            if(request.body){
                option.body=request.body;
            }
            //let res=await axios(option);
            let res=await rp(option);
            let response=new Response(request);
            response.origin=res;
    
            response.headers=res.headers;
            response.status=res.statusCode;
            response.statusText=res.statusMessage;
            response.text=res.body;
            
            if(res.headers["content-type"]&&res.headers["content-type"].indexOf("application/json;")>=0){
                response.json=JSON.parse(res.body);
            }
            return response;
        }
        catch{
            return request;
        }
    }
}