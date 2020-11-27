import Middleware from "../Middleware.js";
import Response from "../Response.js";
import axios from "axios";
export default class extends Middleware{
    async process_request(request,spider){
        try{
            let option={
                url:request.url,
                method:request.method,
                headers:request.headers,
            }
            if(request.data){
                option.data=request.data;
            }
    
            let res=await axios(option);
            let response=new Response(request);
            response.origin=res;
    
            response.headers=res.headers;
            response.status=res.status;
            response.statusText=res.statusText;
            if(typeof(res.data)=="object"){
                response.text=JSON.stringify(res.data);
                response.json=res.data;
            }
            else if(typeof(res.data)=="string"){
                response.text=res.data;
            }
            return response;
        }
        catch{
            return request;
        }
    }
}