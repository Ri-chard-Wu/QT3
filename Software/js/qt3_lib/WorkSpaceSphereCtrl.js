

import {
	Mesh,
	MeshPhongMaterial,
    Vector2,
	Vector3,
    Matrix3,
    Matrix4,
    SphereGeometry,
    EventDispatcher,
    MeshBasicMaterial,
    Raycaster,
    Object3D,
} from 'three';
import { Tween, SchedMode } from './Tween.js';
import { UserMode } from './QT3.js';
import {wsData} from './ws_data.js';

const ctrlName = 'pointcloud';
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const print_p = (p, prefix="", n=2) =>{

    console.log(`[${prefix}] p: ${p.x.toFixed(n)}, ${p.y.toFixed(n)}, ${p.z.toFixed(n)}`);
}
 


class WorkSpaceSphereCtrl{

    constructor(qt3) { 
 
        this.qt3 = qt3;
        let scope = this;
        this.intervalIds = [null, null, null, null, null, null, null];

      
        const mouse = new Vector2();
        let raycaster = new Raycaster();
        let INTERSECTED;
        
        const pointPos = new Vector3();       


        let dashboard = document.querySelector('.dashboard'); 
        let container = document.createElement('div');        
        dashboard.appendChild(container);     
        
        container.style.position= 'absolute'; 

        container.style.right = '3%';
        container.style.bottom = '1%';
        // container.style.backgroundColor =  'rgba(255,127,127,0.25)';
        container.innerHTML = '<h2></h2>';

        let display = container.querySelector('h2'); 
        display.style.color = 'rgba(255,255,255,0.75)';
        display.style.fontSize = '2.2em';
        display.style.textShadow = '0 0 10px rgba(0,255,255,0.95)'; 
        display.innerHTML = '';
        
        this.gizmo = new Object3D();
        this.qt3.scene.add(this.gizmo);

        this.tween = new Tween();
        
        function onPointerDown( event ) {
 
  
            let ja =  INTERSECTED.ja; 
            
            let sched = {
                mode: SchedMode.EXPONENTIAL_INOUT,
                n: 20,
                T: 600 // ms
            };
           
            scope.qt3.setAnglesTimeAligned(ctrlName, ja, sched);
            
        }


		function onPointerMove( event ) {
          
          

            event.preventDefault();
         
            let rect = scope.qt3.scene.userData.element.getBoundingClientRect(); 
            let w = rect.right - rect.left;
            let h = rect.bottom - rect.top;
 
            mouse.x = ( (event.clientX - rect.left) / w ) * 2 - 1;
            mouse.y = - ( (event.clientY - rect.top) / h ) * 2 + 1;



            scope.qt3.scene.userData.camera.updateMatrixWorld();  
            raycaster.setFromCamera( mouse, scope.qt3.scene.userData.camera );
 
            const intersects = raycaster.intersectObjects( scope.gizmo.children, false );
 
            if ( intersects.length > 0 ) {

                scope.qt3.scene.userData.element.style.cursor = "pointer";

                const targetDistance = intersects[ 0 ].distance;
 
                if ( INTERSECTED != intersects[ 0 ].object ) {


                
                    if ( INTERSECTED ) {
                        INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
                        // INTERSECTED.geometry.
                        scope.qt3.scene.userData.element.releasePointerCapture( event.pointerId );
                        scope.qt3.scene.userData.element.removeEventListener( 'click', onPointerDown );                        
                    }

                    scope.qt3.scene.userData.element.setPointerCapture( event.pointerId );
                    scope.qt3.scene.userData.element.addEventListener( 'click', onPointerDown);


                    INTERSECTED = intersects[ 0 ].object;
                    INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                    INTERSECTED.material.color.setHex( 0xffffff );
                          	
                   
                    pointPos.setFromMatrixPosition(INTERSECTED.matrixWorld);
             

                }

            } 
            else {

                scope.qt3.scene.userData.element.style.cursor = "default";

                if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

                INTERSECTED = null;

                scope.qt3.scene.userData.element.releasePointerCapture( event.pointerId );
                scope.qt3.scene.userData.element.removeEventListener( 'click', onPointerDown );                
            }      
            
            if(INTERSECTED){ 
                display.innerHTML = `x: ${pointPos.x.toFixed(2)}  y: ${pointPos.y.toFixed(2)}, z: ${pointPos.z.toFixed(2)}`;
            }
            else{ 
                display.innerHTML = '';
            }
		}
 
        this.qt3.scene.userData.element.addEventListener( 'pointermove', onPointerMove );
 
        this.r = 350;
        this.plotWorkspaceSphere(this.r);
        let ws = new WorkSpaceSphereTuner(this.qt3, this);
    }
 

 

    syncUpdate(j, angle, callerName){
  
    }
 

    addBall(p, ja, r, color){

        const gizmoMaterial = new MeshBasicMaterial( {
            transparent: true
        } );
        gizmoMaterial.color.setHex( color );
        gizmoMaterial.opacity = 0.8;

        const ball = new Mesh(new SphereGeometry(r), gizmoMaterial);

 
        this.gizmo.add(ball);
                            
        
        ball.position.copy(p);  
 

        ball.ja = [0];   
  
        for(let j=1;j<7;j++){ 
            ball.ja.push(ja[j]); 
        }
 
    }

    // r: 300 ~ 380, dr: 5
    _generateWorkspaceSphere(rs, thetaSteps=14, phiSteps=22){

        let scope = this;

        function exploreOrientation(initPose, cb){

            let obj = new Object3D();
 
            obj.position.copy(initPose.position);
            obj.quaternion.copy(initPose.quaternion); 

            let theta_x_step = (Math.PI/2)/3;
            let theta_z_step = (2*Math.PI)/5; 
            for(let theta_x = theta_x_step; theta_x <= Math.PI/2; theta_x +=  theta_x_step){ 
 
                for(let theta_z = 0; theta_z < 2*Math.PI; theta_z += theta_z_step){
                   
                    obj.rotateOnAxis(new Vector3(0, 0, 1), theta_z_step);  
                    obj.rotateOnAxis(new Vector3(1, 0, 0), theta_x);  
     
                    let canStop = cb(obj); 
                    
                    if(canStop){ 
                        return;
                    }
    
                    obj.rotateOnAxis(new Vector3(1, 0, 0), -theta_x);  
                } 
                
                obj.position.copy(initPose.position);
                obj.quaternion.copy(initPose.quaternion); 
            }  

            
        }
 

        let wsDataDict = {};

        rs.forEach(
            (r, i) => { 
                        
                if(r > 380 || r < 300) return;
        
              
                let dTheta = Math.PI/thetaSteps;
                let dPhi = 2*Math.PI/phiSteps;
        
                let obj = new Object3D(); 
                let c = new Vector3();        
         
                wsDataDict[r] = [];
             
                scope.qt3.vir.rArm[1].updateWorldMatrix(true, false);
                scope.qt3.vir.rArm[1].updateMatrixWorld();  
            
                c.setFromMatrixPosition(scope.qt3.vir.rArm[1].matrixWorld);         
                
                c.x += 97; 
        
                for(let theta = 0; theta < Math.PI; theta += dTheta){

                    for(let phi = 0; phi < 2*Math.PI; phi += dPhi){

                        let x = c.x + r * Math.sin(theta) * Math.cos(phi);
                        let y = c.y + r * Math.sin(theta) * Math.sin(phi);
                        let z = c.z + r * Math.cos(theta);
        

                        obj.position.set(x, y, z);
                        obj.lookAt(c.x, c.y, c.z);     
                        obj.rotateOnAxis(new Vector3(0, 1, 0), Math.PI); 
        
                        exploreOrientation(obj, function(obj){
                
                            scope.qt3.ctrls.transform.probeBall.position.copy(obj.position);
                            scope.qt3.ctrls.transform.probeBall.quaternion.copy(obj.quaternion);    
                            let ja = scope.qt3.ctrls.transform.solve_IK(); 
                    
                        
                            if(ja){  
                                let wsData = {p: [obj.position.x, obj.position.y, obj.position.z],  ja:{}};
                                for(let j=1;j<7;j++){  
                                    // wsData.ja[j] = scope.qt3.vir.getAngle(j); 
                                    wsData.ja[j] = ja[j];
                                }

                                
                                wsDataDict[r].push(wsData); 
                                return true;
                            }
                            else{ 
                                return false;
                            }

                        }); 
                    } 
                } 
          
            }
        );

        console.log(JSON.stringify(wsDataDict));

        return wsDataDict;

    }

    

    plotWorkspaceSphere(r=370){

        this.r = r;
 
        let scope = this;

        if(!(r in wsData)){

            let wsData_gen = this._generateWorkspaceSphere([r], 14, 22);            
            for (const [r, data] of Object.entries(wsData_gen)) wsData[r] = data; 
             
        }
   
        wsData[r].forEach(
            (elm, i) => { 
                let p = new Vector3(elm.p[0], elm.p[1], elm.p[2]);                    
                scope.addBall(p, elm.ja, 3, 0x55ffff);
            }
        ) 
 
    }  


    clearWorkspaceSphere(){
 
        this.gizmo.traverse(
            function(obj){
                if(obj.geometry){
                    obj.geometry.dispose();
                }

                if(obj.material)
                    obj.material.dispose();
            }
        );

        this.qt3.scene.remove(this.gizmo);
        this.gizmo = new Object3D();
        this.qt3.scene.add(this.gizmo);  
    }

    getR(){
        return this.r;
    }

    getRLimits(){
        return [300, 370];
    }
}





 
 
class WorkSpaceSphereTuner {

	constructor(qt3, wssCtrl) {
        
        let scope = this;

        this.wwsCtrl = wssCtrl;

        let container = document.createElement('div');
        container.classList.add(`wss-tuner-container`) ;
        container.style.position = `absolute`; 
      

        const canvas = document.createElement('canvas'); 

        canvas.width = window.innerHeight*0.8;
        canvas.height = canvas.width;
 
        container.style.left = `${window.innerWidth/2 - canvas.width/2}px`;
        container.style.top = `${(window.innerHeight*0.8)/2 - canvas.height/2}px`;
 
        let cx = canvas.width/2;
        let cy = canvas.height/2;

        container.appendChild(canvas);
 
        // let dashboard = document.querySelector('.dashboard');  
        qt3.scene.userData.element.appendChild(container); 

        const ctx = canvas.getContext('2d');
     

        let inputBox = document.createElement('div');
        inputBox.classList.add(`input-box`) ;  
        container.appendChild(inputBox);

        
        inputBox.style.position = `absolute`; 
       
         
        inputBox.innerHTML = `
        
        <div class="row">
            <div class="name">R [mm]: </div>

            <div class="input-container">
            
                <input type="text" value="${this.wwsCtrl.getR()}"> 
            </div>
            
        </div> 
        `;

      
        let inputContainer = inputBox.querySelector(".input-container");
          
        function init_input(v){  
            let input = document.createElement('input'); 
            input.type = "text"; 
            input.value = `${v}`;  
            inputContainer.appendChild(input); 
            input.addEventListener('mousedown', onPointerDown, false); 
            return input;
        } 

        let input = init_input(this.wwsCtrl.getR()); 
        let isEntering = false;

        function onPointerDown(evnet){  

            evnet.stopPropagation();

            if(!isEntering){

                isEntering = true; 

                function close(evnet){  

                    let text = input.value; 
                    
                    console.log(`input.value: ${input.value}`);

                    let r = parseInt(text);

                    wssCtrl.clearWorkspaceSphere();
                    wssCtrl.plotWorkspaceSphere(r);
                    updateArc();

                    
                    document.removeEventListener( 'mousedown', close ); 
                    inputContainer.removeChild(input); 
                    input = init_input(input.value);          
                    isEntering = false;
                }

                function onKeyDown(event){ 

                    let key = event.key.toLowerCase(); 
                    // console.log(`key: ${key}`);

                    if(key == 'enter'){ 
                        close();
                    }   
                    else if(key == 'arrowdown' || key == 'arrowleft'){ 
                        // console.log(`a`);
                        let r = wssCtrl.getR() - 10;
                        if(r < wssCtrl.getRLimits()[0]) return;
                        wssCtrl.clearWorkspaceSphere();
                        wssCtrl.plotWorkspaceSphere(r);
                        updateArc();
                        input.value = `${r}`;
                    }  
                    else if(key == 'arrowup' || key == 'arrowright'){ 
                        let r = wssCtrl.getR() + 10;
                        if(r > wssCtrl.getRLimits()[1]) return;
                        wssCtrl.clearWorkspaceSphere();
                        wssCtrl.plotWorkspaceSphere(r);
                        updateArc();
                        input.value = `${r}`;
                    }  
                    
                } 

                input.addEventListener('keydown', onKeyDown );
                document.addEventListener("mousedown", close); 
            }
     
        } 

 

        function updateArc(){ // called when z or R changes.
            
            let z = qt3.scene.userData.camera.position.length();            
            let R = scope.wwsCtrl.getR(); 

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const path = new Path2D();

           
            let r = 754.3*R/Math.sqrt(z*z - R*R);
            r = r*(window.innerHeight*0.00095);
 
 
            path.arc(cx, cy, r, Math.PI, Math.PI/2, true);
            
            ctx.strokeStyle = "rgb(155,255,255)";
            ctx.shadowColor="rgb(0,255,255)"; 
            ctx.shadowBlur=1;
            ctx.lineWidth=0.6;
            ctx.stroke(path);
 

            let x_last, y_last, x_first, y_first;
  
            function moveTo(path, x, y){
    
                path.moveTo(x, y);
    
                x_last = x;
                y_last = y;  
            } 
    
            function lineTo_delta(path, dx, dy){
    
                path.lineTo(x_last + dx, y_last + dy);
    
                x_last = x_last + dx;
                y_last = y_last + dy;  
            }
       
            let theta = 3*Math.PI/4;
            ctx.beginPath(); 
            moveTo(ctx, cx + r*Math.cos(theta), cy + r*Math.sin(theta)) 
            lineTo_delta(ctx, 0.2*r*Math.cos(theta), 0.2*r*Math.sin(theta)); 
            lineTo_delta(ctx, -100, 0);
             
            ctx.font = '13pt Arial'; 
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle'; 
    
            ctx.strokeStyle = "rgb(155,255,255)";
            ctx.shadowColor="rgb(0,255,255)"; 
            ctx.shadowBlur=1;
            ctx.lineWidth=0.6; 
            ctx.stroke();      

                
            const rect = inputBox.getBoundingClientRect();
            let w = Math.abs(rect.left - rect.right);
            let h = Math.abs(rect.top - rect.bottom);
               
            inputBox.style.left = `${x_last-w}px`;
            inputBox.style.top = `${y_last-h/2}px`;  
        }


        qt3.scene.userData.controls.addEventListener("change", updateArc);
        window.addEventListener( 'resize', function(){

            canvas.width = window.innerHeight*0.8;
            canvas.height = canvas.width;
     
            container.style.left = `${window.innerWidth/2 - canvas.width/2}px`;
            container.style.top = `${(window.innerHeight*0.8)/2 - canvas.height/2}px`;
     
            cx = canvas.width/2;
            cy = canvas.height/2;
        
            updateArc(); 
        } );


        updateArc();  
    }




}


export { WorkSpaceSphereCtrl };