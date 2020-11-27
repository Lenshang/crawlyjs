import crawly from "../src/crawly.js";
console.log("Crawly.JS Tester")
class MongoPipeline extends crawly.Pipeline{
    process_item(item,spider){
        console.log(`商品已储存:${item.get("item_name")}`);
    }
}
class TestSpider extends crawly.Spider{
    name="test";
    custom_settings={
        THREADNUM:1,
        ITEM_PIPELINES:[
            MongoPipeline
        ]
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Mobile Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "referer": ": https://m.xiaomiyoupin.com/w/newcomer?_rt=weex&pageid=3358&spmref=YouPin_A.4594.73477.4.80687713"
    }
    constructor(){
        super()
    }

    *start_requests(){
        let _url="https://m.xiaomiyoupin.com/lasagne/page/3358";
        yield new crawly.Request({url:_url,method:"POST",body:JSON.stringify({}),headers:this.headers,callback:this.parse});
    }

    *parse(response){
        let data=response.json;
        let cat="";
        for(let fl of data["floors"]){
            if(fl["module_key"]=="title_single"){
                cat=fl["data"]["title"];
            }
            else if(fl["module_key"]=="product_card_three"){
                for(let item of fl["data"]["result"]["goods_list"]){
                    let good_item={
                        "item_name":item["name"],
                        "item_price":item["price_min"],
                        "item_price_ref":item["market_price"],
                        "images":[]
                    }
                    if(item["pic_url"]){
                        good_item["images"].push(item["pic_url"])
                    }
                    
                    let dbItem=new crawly.Item(good_item);
                    yield dbItem;
                    console.log(`已抓取商品:${good_item["item_name"]}`)
                }
            }
        }
    }

}

var task=new TestSpider();
task.run();