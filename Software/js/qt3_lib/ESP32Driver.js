
import { _objectChangeEvent } from 'three/addons/controls/TransformControls.js';

 


class ESP32Driver {

    constructor() {

        this.bufs = {};
        this.timoutIds = {};

        this.ja = {};
 
        this.reductionRatio = {1:60, 2:60, 3:30, 4:30, 5:30, 6:6.533};
        
        this.applyInitCfg();
    }

    applyInitCfg(){

        for (const [j, value] of Object.entries(this.reductionRatio))
            this.setReductionRatio(j , value);

        let v = 1.5;
        let velLimits = {1:v, 2:v, 3: v, 4: v, 5: v, 6: v};     
        // this.setVelocityLimit(velLimits); 
        for (const [j, value] of Object.entries(velLimits))
            this.setVelocityLimit(j, value);             

    
        let acc = 2;
        let accs = {1: acc, 2: acc, 3: acc, 4: acc, 5: acc, 6: acc};  
        // let accs = {1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4};  
        
        for (const [j, value] of Object.entries(accs))
            this.setAcceleration(j , value); 
        

        // for(let j=1;j<=6;j++)
        // this.setSyncInterval(j, 100);            
    }

 
  
    getAngleIfChangedAsync(js, cb){

        // let js = [1,2,3,4,5,6];
        let scope = this; 

        this.sendHttpRequest("GET", "/get:2;" + js.join(",")+ "\0", null,
            function(data) {
 
                // console.log(`[getAngleIfChangedAsync]: ${data}`);
                // if(data != "") console.log(`[getAngleIfChangedAsync]: ${data}`);

                let kvs = data.split(','); 
                let angles = {};
                for(let i=0;i<kvs.length;i++){
                    if(kvs[i]=="") continue;

                    let kv = kvs[i].split('='); 
                    let j = parseInt(kv[0]);    
                    angles[j] = parseFloat(kv[1]) * 360.0 / scope.reductionRatio[j]; 
                }

                cb(angles);
             
            }
        ); 
    }

    getAngleAsync(js, cb){

        // let js = [1,2,3,4,5,6];
        let scope = this; 

        this.sendHttpRequest("GET", "/get:1;" + js.join(",")+ "\0", null,
            function(data) {


                // console.log(`_getAngleAsync: ${data}`);

                let kvs = data.split(','); 
                let angles = {};
                for(let i=0;i<kvs.length;i++){
                    let kv = kvs[i].split('='); 
                    let j = parseInt(kv[0]);  
                    // scope.ja[j] = parseFloat(kv[1]) * 360.0 / scope.reductionRatio[j]; 
                    angles[j] = parseFloat(kv[1]) * 360.0 / scope.reductionRatio[j]; 
                }

                cb(angles);
             
            }
        ); 
    }


    getAngle(j){
        return this.ja[j];
    }

 



    sendHttpRequest(method, uri, msg, callback){ 

        // console.log(`ESP32Driver.js: sendHttpRequest`);

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 

            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                if(callback) callback(xmlHttp.responseText);
            }
        }
        xmlHttp.open(method, uri, true); // true for asynchronous 
        xmlHttp.setRequestHeader('Content-type','application/x-www-form-urlencoded');		
        xmlHttp.send(msg);
    }


    _set(cmdId, j, value){



        if(!(cmdId in this.bufs)) this.bufs[cmdId] = {};

        this.bufs[cmdId][j] = value; 

        if(cmdId in this.timoutIds) return;       
        let scope = this;
        this.timoutIds[cmdId] = setTimeout(()=> { 

            let cmds = []; 

            for (const [j, value] of Object.entries(scope.bufs[cmdId]))
                cmds.push(`${j}=${value}`);

            let cmd_all = `${cmdId};` + cmds.join(",") + "\0";
            if(cmd_all.length > 127) console.log(`[ESP32Driver.js] Warning: cmd_all.length > 127`);
            scope.sendHttpRequest("POST", "/sendCmd", cmd_all);	
             
            // for (const [j, value] of Object.entries(scope.bufs[cmdId]))
            //     scope.sendHttpRequest("POST", "/sendCmd", `${cmdId};${j}=${value}\0`);	
                
            console.log(`cmd_all: ${cmd_all}`);

            delete scope.bufs[cmdId];
            delete scope.timoutIds[cmdId];          

        } ,100); 
    }
    
    setAngle(j, angle){ // angle: in degree
  
        
        let cmdId = 1;
        angle = (angle / 360.0)* this.reductionRatio[j]; // circle fraction.
        this._set(cmdId, j, angle.toFixed(2));
 
    }
 
    setAngleWithVelocityLimit(j, p, v){ 
       
        let cmdId = 6;
        p = (p / 360.0)* this.reductionRatio[j]; // circle fraction.
        this._set(cmdId, j, p.toFixed(2) + ',' + v.toFixed(2));     
    }


    setVelocityLimit(j, vel){
        // velLimit, 1 ~ 9. Max speed.         
                
        let cmdId = 2;
        this._set(cmdId, j, vel.toFixed(2));
    }

    setAcceleration(j, acc){ 
        // acc, 1 ~ 20. Larger value give sharper transition from 0 to max speed.      

        let cmdId = 3;
        this._set(cmdId, j, acc.toFixed(2));
    }
 

    setReductionRatio(j,  rr){ 
        
        let cmdId = 4;
        this._set(cmdId, j, rr.toFixed(2));     
    }


    getReductionRatio(j){
        return this.reductionRatio[j];
    }

 
    emergencyStop(){
        this.sendHttpRequest("POST", "/sendCmd", "5;\0");	
    }

    reboot(){
        this.sendHttpRequest("POST", "/sendCmd", "7;\0");	

        this.applyInitCfg();
    }

    // interval: ms.
    setSyncInterval(j, interval){
 
        let cmdId = 8;
        this._set(cmdId, j, interval);           
    }
 
  
 
    getFifoLength(cb){
 
        let scope = this; 

        this.sendHttpRequest("GET", "/get:3;\0", null,
            function(data) {  
                
                let fifoLen = parseInt(data);  

                cb(fifoLen); 
            }
        ); 
    }

    

    setAngleWithVelocityLimitFIFO(posVel_all, onDone){    
        

        let scope = this;

        function pushFifo(posVel){  

            let pos = posVel.pos;
            let vel = posVel.vel;

            let cmdId = 10; 
            let cmds = []; 
    
            let s = [];

            for (const [j, value] of Object.entries(pos)){
    
                let p = pos[j];       
                let v = vel[j];
                p = (p / 360.0)* scope.reductionRatio[j];  

                s.push(p.toFixed(2));

                cmds.push(`${j}=${p.toFixed(2) + ',' + v.toFixed(2)}`);
            }   
 
    
            let cmd_all = `${cmdId};` + cmds.join(",") + "\0";
    
            scope.sendHttpRequest("POST", "/sendCmd", cmd_all); 
        }



        let i=0;
        let fifoSize = 12;

        function cb(fifoLen){ 

            if(fifoLen == 0 && i >= posVel_all.length){
                onDone();
                return;
            } 

            let n = fifoSize - fifoLen;
 

            let cnt = 0;
            let intervalId = setInterval( 
                function() {
   
                    if(cnt >= n){   
                        setTimeout(()=> { 
                            scope.getFifoLength(cb);
                        } ,100); 

                        clearInterval(intervalId);  
                    } 
                    else{ 
                        cnt+=1;
                        if(i < posVel_all.length){
                            pushFifo(posVel_all[i]);
                            i+=1;
                        }
    
                    }
                }, 
                100 // ms.
            );	
            
       
        }
 
        this.sendHttpRequest("POST", "/sendCmd", `9;\0`); // init fifo
        this.getFifoLength(cb); 
    }



    


}



export { ESP32Driver };