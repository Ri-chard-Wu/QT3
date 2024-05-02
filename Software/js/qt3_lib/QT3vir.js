
import {
	Mesh,
	MeshPhongMaterial,
	Vector3,
    SphereGeometry, 
    Quaternion,
    Euler,
    LineSegments,
    BufferGeometry,
    Float32BufferAttribute,
    LineBasicMaterial,
    Color,
    Vector2,
    Raycaster,
    Matrix4
} from 'three';

import { Tween, SchedMode } from './Tween.js';
import { _objectChangeEvent } from 'three/addons/controls/TransformControls.js';
 
import { Slider } from './SliderCtrl.js';

 

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

  
const _xAxis = /*@__PURE__*/ new Vector3( 1, 0, 0 );
const _yAxis = /*@__PURE__*/ new Vector3( 0, 1, 0 );
const _zAxis = /*@__PURE__*/ new Vector3( 0, 0, 1 );
const _mxAxis = /*@__PURE__*/ new Vector3( -1, 0, 0 );
const _myAxis = /*@__PURE__*/ new Vector3( 0, -1, 0 );
const _mzAxis = /*@__PURE__*/ new Vector3( 0, 0, -1 );

const print_q = (prefix, q) =>{

    console.log(`[${prefix}] q: ${q._x.toFixed(2)}, ${q._y.toFixed(2)}, ${q._z.toFixed(2)}, ${q._w.toFixed(2)}`);
}




class LinkFrameHelper extends LineSegments {

    // frameOrigin: inst of class Vector3.
    constructor(frameOrigin, xAxis, yAxis, zAxis) {


        const x0 = frameOrigin.x;
        const y0 = frameOrigin.y;
        const z0 = frameOrigin.z;
         

        const vertices = [], colors = [];

        let j = 0;

        // x1, y1, z1, x2, y2, z2
        vertices.push( x0, y0, z0, x0 + xAxis.x, y0 + xAxis.y, z0 + xAxis.z);
        vertices.push( x0, y0, z0, x0 + yAxis.x, y0 + yAxis.y, z0 + yAxis.z);
        vertices.push( x0, y0, z0, x0 + zAxis.x, y0 + zAxis.y, z0 + zAxis.z);



        const color_R = new Color( 0xff0000 );
        const color_G = new Color( 0x00ff00 );
        const color_B = new Color( 0x0000ff );

        color_R.toArray( colors, j ); j += 3;
        color_R.toArray( colors, j ); j += 3;

        color_G.toArray( colors, j ); j += 3;
        color_G.toArray( colors, j ); j += 3;

        color_B.toArray( colors, j ); j += 3;
        color_B.toArray( colors, j ); j += 3;

    

        const geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

        const material = new LineBasicMaterial( { vertexColors: true, toneMapped: false } );

        super( geometry, material );

        this.type = 'LinkFrameHelper';

    }

    dispose() {

        this.geometry.dispose();
        this.material.dispose();

    }

}








class QT3vir{

    constructor(qt3) {

        this.qt3 = qt3;

        this.rArm = {};
        this.lArm = {};
        this.chest = null;

        // initial theta values of the model as arranged in fusion 360.
        this.ja0 = [0, 0, 0, 90, 0, -90, 0, 0]; 
 
        this.ja_homeOffset = [0, 0, 0, 0, 0, 0, 0, 0];
        
        this.ja = [0, 0, 0, 90, 0, -90, 0, 0]; 
        

        this.ja_old = [0, 0, 0, 90, 0, -90, 0, 0];
        this.jv= [0, 0, 0, 0, 0, 0, 0, 0];

        this.listeners = {'pos': [], 'vel': []}


        this.dt = 100;
        let scope = this;
        this.fixedUpdatesId = setInterval(
            function() {
                scope.fixedUpdates();
            }, 
            this.dt // ms.
        );



 
        this.intervalIds = [null, null, null, null, null, null, null];
        this.tween = new Tween();

    }


    fixedUpdates(){
        this.updateVelocity();
    }

    init(obj){

        let scene = this.qt3.scene;

        let rArm = [[], [], [], [], [], [], []];
        let lArm = [[], [], [], [], [], [], []];
        let chest = [];

        let allChildren = [...obj.children];

        for(let i = 0; i < obj.children.length; i++){

            let j = parseInt(obj.children[i].name.slice(5, 6));

            if(obj.children[i].name.slice(0, 4) == 'rArm'){
                 rArm[j].push(obj.children[i]);
            }
            else if(obj.children[i].name.slice(0, 4) == 'lArm'){								
                lArm[j].push(obj.children[i]);
            }
            else{  
                chest.push(obj.children[i]);
            }							
        } 

        for(let i = 0; i < rArm.length; i++){
                        
            for(let j = 1; j < rArm[i].length; j++){
                
                rArm[i][0].attach(rArm[i][j]);
                            
            }		
            this.rArm[i] = rArm[i][0];
        }

        
        for(let j = 1; j < chest.length; j++){
            
            chest[0].attach(chest[j]);
                        
        }		
        this.chest = chest[0];
        



        const framePositions = {
            "chest":  [0, 0, 0],
            "rArm":  [
                [46.5, 0, 38],
                [46.5, 0, 38],

                [133, 0, 38],
                [133, 0, 38],

                [305, 0, 38],
                [305, 0, 38],

                [492.39, 0, 38]			
            ],
            "lArm":  [],							
        }		
        
        
        const frameRotations = {
            "chest":  [0, 0, 0],
            "rArm":  [
                [Math.PI, -Math.PI/2, 0],
                [Math.PI, -Math.PI/2, 0],

                [Math.PI/2, -Math.PI/2, 0],
                [-Math.PI/2, 0, -Math.PI/2],

                [-Math.PI/2, 0, 0],
                [Math.PI, -Math.PI/2, 0],
                [Math.PI/2, -Math.PI/2, 0],
            
            ],
            "lArm":  [],	
        }							

        for(let i = 0; i <= 6; i++){

            this.rArm[i].position.x = framePositions['rArm'][i][0];
            this.rArm[i].position.y = framePositions['rArm'][i][1];
            this.rArm[i].position.z = framePositions['rArm'][i][2];			
            this.rArm[i].rotateZ(frameRotations['rArm'][i][0]);
            this.rArm[i].rotateY(frameRotations['rArm'][i][1]);
            this.rArm[i].rotateX(frameRotations['rArm'][i][2]);
        }

        this.chest.position.x = framePositions['chest'][0];
        this.chest.position.y = framePositions['chest'][1];
        this.chest.position.z = framePositions['chest'][2];			
        this.chest.rotateZ(frameRotations['chest'][0]);
        this.chest.rotateY(frameRotations['chest'][1]);
        this.chest.rotateX(frameRotations['chest'][2]);

        obj.rotateX(-Math.PI / 2);
     
        
        this.chest.attach(this.rArm[0]);
        for(let i = 1; i <= 6; i++){
            this.rArm[i - 1].attach(this.rArm[i]);
        }
 
        // x, z, y
        this.chest.position.set(-146.50+3, 0, -38);

        scene.userData.camera.position.set(0,2500,2500);
        // scene.userData.camera.lookAt(new Vector3(0, 0, 0));

        this.homePose = {};
        this.homePose.p = new Vector3(760, 600, -760);
    

        // display world frame axes.
        const L = 100;
        const linkFrame = new LinkFrameHelper(new Vector3(0, 0, 0), new Vector3(L, 0, 0), new Vector3(0, L, 0), new Vector3(0, 0, L));
        scene.add(linkFrame);	
 

        const ball = new Mesh(new SphereGeometry(5), new MeshPhongMaterial({color: 0xcc0088 }));
        // scene.add(ball);
        obj.add(ball);

        this.rArm[6].updateWorldMatrix(true, false);
        this.rArm[6].updateMatrixWorld();
        
        ball.position.setFromMatrixPosition(this.rArm[6].matrixWorld);

        // this offset will become d_wf in iiwa ik paper.
        ball.position.x += 25;
 
        // rotate to make the local frame axis of ball align that of frame7 in iiwa ik paper.
        ball.rotateY(Math.PI / 2);	
        ball.rotateZ(Math.PI / 2);

        this.rArm[7] = ball;
        this.rArm[6].attach(this.rArm[7]);



        this.qt3.scene.userData.controls.update(true);



        this.q0_rArm = {};
        for (const [j, obj] of Object.entries(this.rArm)){
            this.q0_rArm[j] = new Quaternion();
            this.q0_rArm[j].copy(obj.quaternion);
        }
 

        let quickTuner = new QuickTuner(this.qt3, allChildren, rArm);
       
    }
 
    getHomePose(){
        return {p: this.homePose.p};
    }

    getAngle(j){
        return this.ja[j] + this.ja_homeOffset[j];
    }



    _setAngle(j, angle){ // angle: in deg.

        angle = angle - this.ja_homeOffset[j];
  
        // Frame assignments are following the wrong one in iiwa ik paper.
        // If we replace with correct one (swap 1 & 2, 3 & 4, 5 & 6), need modify rotationAxis.
        let rotationAxis = {
            1: _zAxis,
            2: _zAxis,
            3: _zAxis,
            4: _zAxis,
            5: _zAxis,
            6: _zAxis,
            7: _zAxis
        }

        
        this.rArm[j].quaternion.copy(this.q0_rArm[j]);

 
        let delta_angle;
        delta_angle = angle - this.ja0[j];

        this.rArm[j].rotateOnAxis(rotationAxis[j], delta_angle * DEG2RAD);
        this.ja[j] = angle;	
    }

    done(j){
        return this.tween.done(j);
    }

    stop(j){
        if(this.intervalIds[j]){
            clearInterval(this.intervalIds[j]); 
        }

        this.intervalIds[j] = null;
    }

    getMaxSpeed(){
        return 3;
    }

  

    setAngle(ctrlName, j, angle, sched=null){ // angle: in deg.
 

        if(!sched){ // move to target instantaneously without animation.

            this._setAngle(j, angle);
            this.qt3.syncCtrlAngles(ctrlName, j, angle);
        }
        else{
            
            let start = this.getAngle(j);
            let end = angle; 
            let n = sched.n;
            let T = sched.T;

            this.tween.newSchedule(j, start, end, n, sched.mode);

            clearInterval(this.intervalIds[j]);

            let scope = this;
            this.intervalIds[j] = setInterval(
                function() { 

                    let angleNext = scope.tween.step(j);
             
                    scope.qt3.syncCtrlAngles(ctrlName, j, angleNext);
                    scope._setAngle(j, angleNext);

                    if(scope.tween.done(j)){
                        let id = scope.intervalIds[j];
                        scope.intervalIds[j] = null;
                        clearInterval(id);
                    }
                }, 
                T/n // ms.
            );	   
        }
    }

 

    updateVelocity(){

        let scope = this;

        for(let j=1;j<7;j++){ 
            this.jv[j] = (this.ja[j] - this.ja_old[j]) * DEG2RAD * 1000/ this.dt;
            this.ja_old[j] = this.ja[j]; 
        }

        this.listeners['vel'].forEach((cb) => {
            cb(this.jv);
        });   
    }

    addListener(tag, cb){
        this.listeners[tag].push(cb)
    }

    getEndEffectorPosition(){

        let p = new Vector3();

        this.rArm[7].updateWorldMatrix(true, false);
        this.rArm[7].updateMatrixWorld(); 
 
        p.setFromMatrixPosition(this.rArm[7].matrixWorld);  
        
        return p;
    }

    getEndEffectorEuler(){

        this.rArm[7].updateWorldMatrix(true, false);
        this.rArm[7].updateMatrixWorld(); 
 
        let q = new Quaternion();
        q.setFromRotationMatrix(this.rArm[7].matrixWorld);

        let rot = new Euler();
        rot.setFromQuaternion( q, undefined, false );        

        return rot;
    }


    getEndEffectorMatrixWorld(){

        this.rArm[7].updateWorldMatrix(true, false);
        this.rArm[7].updateMatrixWorld(); 
        
        let m = new Matrix4(); 
        m.copy(this.rArm[7].matrixWorld);

        return m;
       
    }
}


class QuickTuner{

    constructor(qt3, allChildren, rArm){
        
        
        this.qt3 = qt3;

        let cfg = { 
            min: parseInt(this.qt3.jl[1][0]), 
            max: parseInt(this.qt3.jl[1][1]),   
            initialValue: this.qt3.vir.getAngle(1), 
            displayName: `J${1}` 
        };
        let slider = new Slider(1, this.qt3, null, '.dashboard', cfg);
         
        this.qt3.addToSyncList('quickTuner', slider);


        slider.setD(100); 
        let dashboard = document.querySelector('.dashboard');   
        dashboard.appendChild(slider.getDom()); 
        slider.getDom().style.visibility='hidden';
        slider.setOpacity(1);
 
        let timeoutId = null;

        function showOptions(j, x, y){                    
  


            clearTimeout(timeoutId);
 
            let pos = {'left': `${x-50}px`, 'top': `${y-50}px`};
            slider.setPos(pos); 
            slider.setDisplayName(`j${j}`);
            slider.setMin(scope.qt3.jl[j][0]);
            slider.setMax(scope.qt3.jl[j][1]);            
            slider.setAngle(scope.qt3.vir.getAngle(j));
            slider.setJoint(j);

            
            slider.getDom().style.visibility='visible';
        }

        
        function closeOptions(){      
            slider.getDom().style.visibility='hidden';
            document.removeEventListener("mousedown", closeOptions);
   
        }

        const mouse = new Vector2();
        let raycaster = new Raycaster();
        let INTERSECTED;
        let currentHexs = {};
        let scope = this;

        function onPointerDown(event){  
            let rect = scope.qt3.scene.userData.element.getBoundingClientRect(); 
            showOptions(INTERSECTED, event.clientX - rect.left, event.clientY - rect.top);

            document.addEventListener("mousedown", function(e){
               
                closeOptions();
            });
            slider.getDom().addEventListener("mousedown", function(e){
             
                e.stopPropagation();
            });            
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

            const intersects = raycaster.intersectObjects( allChildren, false );
 
            if ( intersects.length > 0 ) {

                scope.qt3.scene.userData.element.style.cursor = "pointer";
 
                let name = intersects[ 0 ].object.name;
                if(name.slice(0, 4) != 'rArm') return;

                let j = parseInt(name.slice(5, 6));
                 



                if ( INTERSECTED != j ) {
 
                    if ( INTERSECTED ) { 
                        rArm[INTERSECTED].forEach(
                            (obj, i) => { 
                                obj.material.color.setHex( currentHexs[i] );
                            }
                        )   
                        
                        scope.qt3.scene.userData.element.releasePointerCapture( event.pointerId );
                        scope.qt3.scene.userData.element.removeEventListener( 'click', onPointerDown);                         
                    } 


                    scope.qt3.scene.userData.element.setPointerCapture( event.pointerId );
                    scope.qt3.scene.userData.element.addEventListener( 'click', onPointerDown);

                    INTERSECTED = j; 
                    rArm[j].forEach(
                        (obj, i) => {
                            currentHexs[i] = obj.material.color.getHex();
                            obj.material.color.setHex( 0xffffff );
                        }
                    ) 
                }

            } 
            else {

                scope.qt3.scene.userData.element.style.cursor = "default";

                if ( INTERSECTED ){ 

                    rArm[INTERSECTED].forEach(
                        (obj, i) => { 
                            obj.material.color.setHex( currentHexs[i] );
                        }
                    )  
                } 

                INTERSECTED = null;
               
                scope.qt3.scene.userData.element.releasePointerCapture( event.pointerId );
                scope.qt3.scene.userData.element.removeEventListener( 'click', onPointerDown); 
            }      
             
		}  
        this.qt3.scene.userData.element.addEventListener( 'pointermove', onPointerMove ); 
    }
}





export { QT3vir, LinkFrameHelper};