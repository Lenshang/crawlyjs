export default class{
    origin=null;
    headers=null;
    status=null;
    statusText=null;
    text=null;
    json=null;
    constructor(request){
        this.request=request;
        this.meta=request.meta;
    }
}