class Test{
    constructor(){

    }

    *test(){
        console.log(this);
        yield "A";
        yield "B";
        yield "C";
    }

    run(){
        var iter = this.test();
        var obj=iter.next();
        while(!obj.done){
            console.log(obj.value);
            obj=iter.next();
        }
    }
}
class Test2 extends Test{
    *test(){
        console.log(this);
        yield "D";
        yield "E";
        yield "F";
    }
}
(new Test2()).run();