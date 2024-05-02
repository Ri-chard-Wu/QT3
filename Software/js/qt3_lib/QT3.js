
import {
	Mesh,
	MeshPhongMaterial,
	Vector3,
    EventDispatcher
} from 'three';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { _objectChangeEvent } from 'three/addons/controls/TransformControls.js';

import { TransformCtrl } from './TransformCtrl.js';
import { SliderCtrl } from './SliderCtrl.js';
import { WorkSpaceSphereCtrl } from './WorkSpaceSphereCtrl.js';

import { KeyFrameEditor } from './KeyFrameEditor.js'; 

import { Tween, SchedMode } from './Tween.js';
import { QT3vir } from './QT3vir.js';
import { QT3phy } from './QT3phy.js';  
import { UserModeHelper } from './UserModeHelper.js';
 
  
import { ViewCube } from './ViewCube.js';



const print_p = (p) =>{

    console.log(`p: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);
}

 
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

  
const UserMode = {
                    VIR: 0,   
                    VIR2PHY: 1, 
                    PHY2VIR: 2, 
                    CALIBRATE: 3};

class QT3 extends EventDispatcher  {

    constructor(scene, dashboardDom, renderer, url, esp32Deploy) {

        super();
 
        this.j0 = [0, 45, -90, 90, 30, 0, 0, 0];
        
        this.scene = scene;
        
        this.renderer = renderer;
        this.esp32Deploy = esp32Deploy;
        let scope = this;
        this.vir = new QT3vir(this);
        if(this.esp32Deploy) 
            this.phy = new QT3phy(this);
 
        this.userModeHelper = new UserModeHelper(this, UserMode.VIR, function(oldModeId, newModeId){
            // console.log(`oldMode: ${oldMode}, newMode: ${newMode}`);
            if(oldModeId == UserMode.CALIBRATE){
                // console.log(`oldModeId == UserMode.CALIBRATE`);
                scope.phy.SaveCalibrateData();
            }      
            else if(newModeId == UserMode.CALIBRATE){
                for(let j = 1; j <= 7; j++){ 
                    scope.vir.setAngle("", j, scope.j0[j], null);
                }
            }
            else if(newModeId == UserMode.PHY2VIR){
                scope.phy.syncVirEnabled = true;
            }
            else if(oldModeId == UserMode.PHY2VIR){
                scope.phy.syncVirEnabled = false;
            }

        });
        




        this.dashboardDom = dashboardDom;

        this.ctrls = {};
        this.syncList = {};
        this.intervalIds = [null, null, null, null, null, null, null];

        
        this.jl = [
            [0, 0],  // dummy 
            [-180 , 180] ,  
            [-90 , 50]  ,   
            [-90, 170] ,   
            [-20, 70] ,   
            [-160, 160] ,   
            [-50 , 50]  , 
            [-170, 170]];	
 

        const loadObj = (objLoader, callback) => {
             
            objLoader.load(url, 
        
                obj => {          
                    if (!objLoader.materials) {
        
                        obj.traverse(
                            child => { 
                                if (child instanceof Mesh)   
                                    child.material = new MeshPhongMaterial({color: parseInt(child.name.split("-")[2], 16) });
 
                            }

                        ); 
                    }	
                    
                    scene.add(obj); 
                     
                    if (callback) callback(obj);
                
                 },  
                xhr => {},  
                err => {});
        };
   
        const objLoader = new OBJLoader();

        loadObj(objLoader, function(obj){ 
            scope.vir.init(obj); 

            scope.initctrls(); 
            scope.viewCube = new ViewCube(scope);        
            scope.kf = new KeyFrameEditor(scope);
            
            scope.switchView(null, scope.getHomePose().p);

            scope.onWindowResize();
        });
    }
 
    initctrls(){
 
        let sliderCfgs = [];
      
        for(let i = 1; i <= 7; i++){
            
            sliderCfgs.push({ 
                // pos: pos[i-1],  
                min: parseInt(this.jl[i][0]), 
                max: parseInt(this.jl[i][1]),   
                initialValue: this.j0[i], 
                displayName: `J${i}` 
            })
        }

      
        this.ctrls.slider = new SliderCtrl(this, '.dashboard', sliderCfgs);  
        this.ctrls.transform = new TransformCtrl(this); 
        this.ctrls.wss = new WorkSpaceSphereCtrl(this);


        this.syncList.slider = this.ctrls.slider;
        this.syncList.transform = this.ctrls.transform;
        this.syncList.wss = this.ctrls.wss;
     
        this.setUserMode(UserMode.VIR);
        
        setTimeout(()=> {
            
            let sched = {
                mode: SchedMode.EXPONENTIAL_INOUT,
                n: 20,
                T: 600
            };

            for(let j = 1; j <= 7; j++){ 
                this.vir.setAngle("", j, this.j0[j], sched);
            }
 
        }, 200); 
  
    }
  
 

    getHomePose(){
        return this.vir.getHomePose();
    }

 
    switchView(p1, p2){
        this.viewCube.switchView(p1, p2);
    }

    stop(j){
        if(this.getUserMode() == UserMode.VIR2PHY){
             
        }
        else if(this.getUserMode() == UserMode.VIR || this.getUserMode() == UserMode.CALIBRATE){

            this.vir.stop(j);

        }    
    }

    getMaxSpeed(){

        if(this.getUserMode() == UserMode.VIR2PHY){
            
            return this.phy.getMaxSpeed();
        }
        else if(this.getUserMode() == UserMode.VIR || this.getUserMode() == UserMode.CALIBRATE){
 
            return this.vir.getMaxSpeed(); 
        }    
    }


    setAnglesTimeAlignedFIFO(callerName, ja_all){
     
        if(this.getUserMode() == UserMode.VIR2PHY){ 
            
            let posVel_all = [];
            let ja_prev = {};
            
            for(let j=1;j<7;j++) ja_prev[j] = this.vir.getAngle(j);
    
    
            for(let i=0;i<ja_all.length;i++){
    
                let ja = ja_all[i];
    
                let deltas = {};
                let deltaMax = -1;
                for(let j=1;j<7;j++) {
                    
                    let delta = Math.abs(ja[j] - ja_prev[j]) * this.phy.getReductionRatio(j);                    
                    ja_prev[j] = ja[j];
    
                    deltas[j] = delta;
    
                    if(delta > deltaMax) deltaMax = delta;
                } 
                
                let maxSpeed = this.phy.getMaxSpeed(); 
                let T = deltaMax / maxSpeed;  
                
                let vel = {};
                let pos = {};
                for(let j=1;j<7;j++) { 
                    let rr = this.phy.getReductionRatio(j);
                    if((deltas[j]/rr) < 1) continue;
         
                    pos[j] = ja[j];
                    
                    let v = Math.abs(deltas[j] / T);
    
    
                    v = Math.max(0.3, v);
                    if(v > maxSpeed+0.1) {
                        console.log(`[QT3.js] Warning: v > maxSpeed: ${v}`);
                        v = maxSpeed;
                    }
                    vel[j] = v;  
                }  
    
                if(Object.keys(pos).length > 0)
                    posVel_all.push({'pos': pos, 'vel': vel});
            }
          
            this.phy.setAngleWithVelocityLimitFIFO(callerName, posVel_all); 
        }
        else if(this.getUserMode() == UserMode.VIR || this.getUserMode() == UserMode.CALIBRATE){ 

            let sched = {
                // mode: SchedMode.EXPONENTIAL_INOUT,
                mode: SchedMode.LINEAR,
                n: 10,
                T: 100
            };

            let i = 0;

            let scope = this;
            let intervalId = setInterval(

                function() {
                     
                    if(i > ja_all.length){                          
                        clearInterval(intervalId);  
                    } 
                    else{
                        let ja = ja_all[i];
                        i += 1;
                        for(let j=1;j<7;j++) scope.vir.setAngle("", j, ja[j], sched);
                    }                   
                }, 
                sched.T // ms.
            );
 
        } 
    }



    setAnglesTimeAligned(callerName, ja, sched=null){
         
        if(this.getUserMode() == UserMode.VIR2PHY){ 

            
            let deltas = [0];
            let deltaMax = -1, deltaMaxIdx = -1;
            for(let j=1;j<7;j++) {
                
                let delta;
            
                delta = Math.abs(ja[j] - this.vir.getAngle(j)) * this.phy.getReductionRatio(j);                

                // if(delta > 0.1) pos[j] = ja[j];

                deltas.push(delta);
    
                if(delta > deltaMax){
                    deltaMax = delta;
                    deltaMaxIdx = j;
                }
            } 
            
            let maxSpeed = this.phy.getMaxSpeed(); 
            let T = deltaMax / maxSpeed;  
            
            
            let vel = {};
            let pos = {};
            for(let j=1;j<7;j++) {
                
                if(deltas[j] < 0.1) continue;
     
                pos[j] = ja[j];
                
                let v = Math.abs(deltas[j] / T) ;
                v = Math.max(0.1, v); 

                if(v > maxSpeed+0.1) {
                    console.log(`[QT3.js] Warning: v > maxSpeed: ${v}`);
                    v = maxSpeed;
                }

                vel[j] = v;
 
                console.log(`j${j}, vel: ${vel[j].toFixed(2)} T: ${T.toFixed(2)}`);
            }

            if(Object.keys(pos).length == 0){
                console.log(`Object.keys(pos).length == 0`);
                return;
            }

             
            for(let j=1;j<7;j++) {
            
                if(deltas[j] < 0.1) continue; 

                this.phy.setAngleWithVelocityLimit(callerName, j, ja[j], vel[j]);                    
            } 
           

        }
        else if(this.getUserMode() == UserMode.VIR){

            for(let j=1;j<7;j++) this.vir.setAngle(callerName, j, ja[j], sched);

        }  
        else if(this.getUserMode() == UserMode.CALIBRATE){

            for(let j=1;j<7;j++) this.vir.setAngle(callerName, j, ja[j], sched);

        }     

    }



    setAngleWithVelocityLimit(callerName, j, angle, v){
        if(v < 0) return;
        
        if(this.getUserMode() == UserMode.VIR2PHY){
            
            if(v > this.phy.getMaxSpeed()){
                v = this.phy.getMaxSpeed(); // dobule check.
                console.log(`[setAngleWithVelocityLimit] Warning: v > this.phy.getMaxSpeed()`);
            }

            this.phy.setAngleWithVelocityLimit(callerName, j, angle, v);
        }
        else if(this.getUserMode() == UserMode.VIR || this.getUserMode() == UserMode.CALIBRATE){

            let sched = { 
                mode: SchedMode.LINEAR,
                n: 10,
                T: 100
            };

            this.vir.setAngle(callerName, j, angle, sched);

        }     
    

    }

    setAngle(callerName, j, a, sched){
 

        if(this.getUserMode() == UserMode.VIR2PHY){
            
            this.phy.setAngle(callerName, j, a);
        }
        else if(this.getUserMode() == UserMode.VIR){

            this.vir.setAngle(callerName, j, a, sched);

        }     
        else if(this.getUserMode() == UserMode.CALIBRATE){

            this.vir.setAngle(callerName, j, a, sched);

        }     
    }

    getUserMode(){
        return this.userModeHelper.getUserMode();
    }


    setUserMode(mode){
        this.userModeHelper.setUserMode(mode);
    }

    

    syncCtrlAngles(callerName, j, angle){ // called only by qt3.vir.
           
        for (const [name, obj] of Object.entries(this.syncList)) obj.syncUpdate(j, angle, callerName);
    } 

    addToSyncList(name, obj){
        this.syncList[name] = obj;
    }

  
    onWindowResize(){
 
        this.kf.onWindowResize();
    }





    updateSize() {

        const width = this.renderer.webglCanvas.clientWidth;
        const height = this.renderer.webglCanvas.clientHeight;

        if ( this.renderer.webglCanvas.width !== width || this.renderer.webglCanvas.height !== height ) {

            this.renderer.setSize( width, height, false );
        }

    }




    render() {
 
        this.updateSize();

        this.renderer.webglCanvas.style.transform = `translateY(${window.scrollY}px)`;
 
        this.renderer.setScissorTest( false );
        this.renderer.clear();
 
        this.renderer.setScissorTest( true );


        for (const [name, scene] of Object.entries(this.renderer.scenes)) {
        
         
            const element = scene.userData.element;

            const rect = element.getBoundingClientRect();

            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            const left = rect.left;
            const bottom = this.renderer.domElement.clientHeight - rect.bottom;
            
            this.renderer.setViewport( left, bottom, width, height );
            this.renderer.setScissor( left, bottom, width, height );

            const camera = scene.userData.camera;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
 

            this.renderer.render( scene, camera );
        }
    }



}


 

export { QT3, UserMode };