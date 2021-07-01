import crawly from "../src/crawly.js";
import cluster from "cluster";
import Response from "../src/core/Response.js";
import axios from "axios";
export default class extends crawly.Middleware{
    async init(spider){
        // if(cluster.isMaster){
        //     this.worker=cluster.fork();
        // }
        // else{

        // }
    }
    async process_request(request,spider){
        console.log(`Request Start,Url:${request.url}`);
        return request;
    }

    async process_response(response,spider){
        console.log(`Response Received,status:${response.statusText}`);
        return response;
    }
}

// if(!cluster.isMaster){
//     let response=new Response(null);
//     console.log(response);
// }