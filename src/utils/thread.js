
export default{
    sleep:function(mSeconds){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, mSeconds);
        });
    }
}