export default class extends Map{
    constructor(defaultObj=null){
        super();
        if(defaultObj){
            for(let key in defaultObj){
                this[key]=defaultObj[key];
            }
        }
    }
}