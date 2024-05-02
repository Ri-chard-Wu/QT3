


const SchedMode = { DIRECT:            0,
                    LINEAR:            1,         
                    EXPONENTIAL_IN:    2, 
                    EXPONENTIAL_OUT:   3, 
                    EXPONENTIAL_INOUT: 4 
                   };




class Tween{
    
    constructor() {
 
        this.cb = {};
    }


    newSchedule(j, a1, a2, n, mode){ 

        if(j in this.cb)
            clearInterval(this.cb[j].intervalId);

        // n: number of updates to go from a1 to a2.
        this.cb[j] = {start: a1, end: a2, n: n, i: 0, done: (a1==a2), running: false, mode: mode, intervalId: null};
 
    }

    start(j, interval, onStep){

        if(this.cb[j].done) return;

        this.cb[j].running = true;
        
        clearInterval(this.cb[j].intervalId);


        let scope = this;
        
        this.cb[j].intervalId = setInterval( 

            function() {

                let a_next = scope.step(j); 

                onStep(a_next);

                if(scope.done(j)){ 
                    scope.cb[j].running = false;
                    clearInterval(scope.cb[j].intervalId); 
                    // if(onDone) onDone();
                } 

            }, 
            interval // ms.
        );	

    }

    stop(j){
        clearInterval(this.cb[j].intervalId); 
    }


    step(j){   
        if(this.cb[j].mode == SchedMode.DIRECT) { return this.step_direct(j); }
        else if(this.cb[j].mode == SchedMode.LINEAR){  return this.step_linear(j);}
        else if(this.cb[j].mode == SchedMode.EXPONENTIAL_INOUT){  return this.step_exponential_inOut(j);}
         
    }


    step_direct(j){

        let next = this.cb[j].end;
        this.cb[j].done = true;

        

        return next;
    }


    step_linear(j){

        let next = (this.cb[j].end - this.cb[j].start) * (this.cb[j].i / this.cb[j].n) + this.cb[j].start;

        this.cb[j].i += 1;
        if(this.cb[j].i == (this.cb[j].n + 1)) this.cb[j].done = true;
 
        return next;
    }

    step_exponential_inOut(j){

        let next;

        let n = this.cb[j].n;
        let i = this.cb[j].i;
        let start = this.cb[j].start;
        let end = this.cb[j].end;

        let f = (end < start) ? -1 : 1;

        let beta = 0.05;
        let alpha = Math.log((0.5/beta) * Math.abs(end - start) + 1) * 2/n;

        if(i < n/2){

            next = f * beta * (Math.exp(i * alpha) - 1) + start;
        }
        else{
            next = - f * beta * (Math.exp(-(i - n) * alpha) - 1) + end;
        } 

        this.cb[j].i += 1;
        if(this.cb[j].i == (this.cb[j].n + 1)) this.cb[j].done = true;
  
        return next;
    }

    done(j){
        if(j in this.cb)
            return this.cb[j].done;
        else{
            console.log(`[Tween.js] Warning: ${j} doesn't exist!`);
            return true;
        }
    }

    running(j){
        if(j in this.cb)
            return this.cb[j].running;
        else{             
            return false;
        }
    }


}





export { Tween, SchedMode };