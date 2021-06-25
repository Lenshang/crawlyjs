export default class extends Map{
    constructor(defaultObj=null){
        super();
        if(defaultObj){
            for(let key in defaultObj){
                this[key]=defaultObj[key];
            }
        }
    }
    allkeys(){
        var r=[];
        for(var k in this){
            r.push(k);
        }
        return r;
    }
    allvalues(){
        var r=[]
        for(var k in this){
            r.push(this[k]);
        }
        return r;
    }
}