import crawly from "../src/crawly.js";
export default class extends crawly.Pipeline{
    process_item(item,spider){
        console.log(item);
    }
}