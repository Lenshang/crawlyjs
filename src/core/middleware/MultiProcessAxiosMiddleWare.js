import Middleware from "../Middleware.js";
import Response from "../Response.js";
import axios from "axios";
import cluster from "cluster";
import path from "path";
class Worker {
    run = () => {
        process.on('message', (msg) => {
            console.log("worker:"+msg);
        });
        while(true){}
    }
}
export default class extends Middleware {
    constructor() {
        super();
        this.workers = []
    }
    async init(spider) {
        if (cluster.isMaster) {
            this.workers.push(cluster.fork());
            // for (var i = 0; i < spider.custom_settings.MAXTHREAD; i++) {
            //     this.workers.push(cluster.fork())
            // }
        }
    }
    async process_request(request, spider) {
        try {
            let option = {
                url: request.url,
                method: request.method,
                headers: request.headers,
            }
            if (request.data) {
                option.data = request.data;
            }
            if (request.body) {
                option.data = request.body;
            }
            
            this.workers[0].send(request.url)


            let res = await axios(option);
            let response = new Response(request);
            response.origin = res;

            response.headers = res.headers;
            response.status = res.status;
            response.statusText = res.statusText;
            if (typeof (res.data) == "object") {
                response.text = JSON.stringify(res.data);
                response.json = res.data;
            }
            else if (typeof (res.data) == "string") {
                response.text = res.data;
            }
            return response;
        }
        catch {
            return request;
        }
    }
}

if (!cluster.isMaster) {
    new Worker().run();
}
