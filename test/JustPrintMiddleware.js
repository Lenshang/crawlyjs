import crawly from "../src/crawly.js";
export default class extends crawly.Middleware{
    async process_request(request,spider){
        console.log(`Request Start,Url:${request.url}`);
        return request;
    }

    async process_response(response,spider){
        console.log(`Response Received,status:${response.statusText}`);
        return response;
    }
}