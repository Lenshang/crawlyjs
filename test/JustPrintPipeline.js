import crawly from "../src/crawly.js";
export default class extends crawly.Pipeline{
    process_item(item,spider){
        console.log(item);
    }
    async init(spider){
        //throw new Error("test error!");
    }
    async on_close(){
        console.log("just print pipeline closed");
    }
}