

import { _objectChangeEvent } from 'three/addons/controls/TransformControls.js';
import { ESP32Driver } from './ESP32Driver.js';
import { UserMode } from './QT3.js';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

  



class QT3phy{

    constructor(qt3) {

        this.qt3 = qt3;
        this.trackTb = {};
        let scope = this;
        this.esp32driver = new ESP32Driver();
 
        this.dir = [0, -1, 1, 1, -1, 1, 1, -1];
        this.offset_vir = [0, 0, 0, 0, 0, 0, 0, 0]; 
        this.offset_phy = {};

        this.ja = {};


        this.intervalId = null;
        this.syncVirEnabled = false;
         
        this.fixedUpdatesId = setInterval(
            function() {
                scope.fixedUpdates();
            }, 
            100 // ms.
        );	 
           

        
    }

    SaveCalibrateData(){
        
        console.log(`[SaveCalibrateData]`);
        
        for(let j=1;j<7;j++){ 

            let a = this.qt3.vir.getAngle(j);
            this.offset_vir[j] = a; 
            this.offset_phy[j] = this.ja[j]; 

            console.log(`j${j}: offset_vir: ${this.offset_vir[j].toFixed(2)}, offset_phy: ${this.offset_phy[j].toFixed(2)}`);
        } 
    }


    fixedUpdates(){
        this.sync();
    }

    sync(){
        let scope = this;
        
        
        this.esp32driver.getAngleAsync([1,2,3,4,5,6], 
            function(angles){
                for (const [j, a] of Object.entries(angles)){
                    scope.ja[j] = a;
  
                    if(scope.syncVirEnabled){
                        
                        let angle = scope.dir[j] * (a - scope.offset_phy[j]) + scope.offset_vir[j];

                        scope.qt3.vir.setAngle("", j, angle);
                    }
                }
            }
        );
    }
  
    getReductionRatio(j){
        return this.esp32driver.getReductionRatio(j);
    }

    
    emergencyStop(){
        this.esp32driver.emergencyStop();
    }

    reboot(){
        this.esp32driver.reboot();
    }

    getMaxSpeed(){
        return 2.5; // rev/s of motor, not reducer output.
    }

    setHomeOffset(offset){
        this.offset_vir = [...offset];
    }
 
  

    setAngle(callerName, j, angle, sched=null){ // angle: in deg.
 
        let a = this.dir[j] * (angle - this.offset_vir[j]) + this.offset_phy[j];
 
        this.esp32driver.setAngle(j, a);

        this.track(callerName, j, angle);
    }
    

 
    setAngleWithVelocityLimit(callerName, j, angle, v){ 
      
 
        let a = this.dir[j] * (angle - this.offset_vir[j]) + this.offset_phy[j];

        this.esp32driver.setAngleWithVelocityLimit(j, a, v);

        this.track(callerName, j, angle);
    }

    
 

    setAngleWithVelocityLimitFIFO(callerName, posVel_all){ 
        
        for(let i=0;i<posVel_all.length;i++){
          
            let pos = posVel_all[i].pos;
            for (const [j, value] of Object.entries(pos)){

                let p = posVel_all[i].pos[j];
                posVel_all[i].pos[j] = this.dir[j] * (p - this.offset_vir[j]) + this.offset_phy[j];
 
            }
        }

        let scope = this;
        this.syncVirEnabled = true;
        this.esp32driver.setAngleWithVelocityLimitFIFO(posVel_all,
            function(){ 
            }); 
    }



    applyOffset(j, a){ 
        let s1 = a - this.offset_vir[j];
        let s2 = s1 * this.dir[j];
        let s3 = s2 + this.offset_phy[j]; 
        return s3;
    }
 
    
    done(j){
        if(j in this.trackTb) 
            return this.trackTb[j].done;
        else{ 

            return true;
        }
    }

 
    progress(j){
        

        if(j in this.trackTb) {
        
      
            let a = this.dir[j] * (this.ja[j] - this.offset_phy[j]) + this.offset_vir[j]; 

            let a_t = this.trackTb[j].targetAngle; 
            let a_i = this.trackTb[j].initialAngle;
            if(a_t - a_i < 0.01) return 1;

            return (a - a_i) / (a_t - a_i);
        
        }else{ 
            return 1;
        }        
    }
 

    track(callerName, j, angle){
 
        this.trackTb[j] = {caller: callerName, 
            initialAngle: this.qt3.vir.getAngle(j), 
            targetAngle: angle, 
            done: false, 
            count: 0,
            T: Date.now()
        };       

        this.nTracking += 1;
          
        if(this.intervalId) return;

        let scope = this; 
        let eps = 0.1;
        this.intervalId = setInterval( 

            function() {
  
                for (let [j, tb] of Object.entries(scope.trackTb)) {
                    if(tb.done) continue;
                     
                    
                    let a = scope.ja[j];   
                    a = scope.dir[j] * (a - scope.offset_phy[j]) + scope.offset_vir[j];  
                
                    scope.qt3.vir.setAngle(tb.caller, j, a);
                  
                    let eps = 0.1;   
                      
                    if(Math.abs(a - tb.targetAngle) < eps){ 

                        tb.count += 1;
                        if(tb.count >= 2) { 

                            tb.done = true;
                            tb.T = Date.now() - tb.T;
                            
                            scope.nTracking -= 1;
                            if(scope.nTracking == 0){
                                let id = scope.intervalId;
                                scope.intervalId = null;
                                clearInterval(id);
                            }
                            
                        } 
                    }
                    else{
                        tb.count = 0; 
                    } 
                }   
            },  
            100 // ms.
        );	 
    }
 
}
 

export { QT3phy };