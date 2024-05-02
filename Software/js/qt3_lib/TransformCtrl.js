
import {
	Mesh,
	MeshPhongMaterial,
	Vector3,
    SphereGeometry,
    Quaternion,
    Matrix3,
    Matrix4
} from 'three';

import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { _objectChangeEvent } from 'three/addons/controls/TransformControls.js';
 
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;


const print_T = (T) =>{

 
    var str = ``;
    for(let i = 0; i < 16; i++){
        str = str.concat(', ', `${T.elements[i].toFixed(2)}`)
    }
    console.log(`T: ${str}`);


}


const print_R = (R) =>{

 
    var str = ``;
    for(let i = 0; i < 9; i++){
        str = str.concat(', ', `${R.elements[i].toFixed(2)}`)
    }
    console.log(`R: ${str}`);


}

const print_p = (p) =>{

    console.log(`p: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);
}

const emitEvent = (element, eventName, data) => {
    element.dispatchEvent(new window.CustomEvent(eventName, {
      detail: data
    }));
  };


const ctrlName = 'transform';
class TransformCtrl{

     constructor(qt3) {
 
        this.qt3 = qt3;
        let scope = this;
 
        // TransformControls
        const transformControls = new TransformControls(qt3.scene.userData.camera, qt3.scene.userData.element);
        transformControls.setSize(1);
        transformControls.setSpace('local');

        qt3.scene.add(transformControls);
         

        const probeBall = new Mesh(new SphereGeometry(5), new MeshPhongMaterial({color: 0xcc8800 }));
        qt3.scene.add(probeBall);
        
        this.probeBall = probeBall;

        this.qt3.vir.rArm[7].updateWorldMatrix(true, false);
        this.qt3.vir.rArm[7].updateMatrixWorld();
        probeBall.quaternion.setFromRotationMatrix(this.qt3.vir.rArm[7].matrixWorld);
        probeBall.position.setFromMatrixPosition(this.qt3.vir.rArm[7].matrixWorld);
         
        transformControls.attach(probeBall);

        transformControls.addEventListener('dragging-changed', function (event) {
 
        	qt3.scene.userData.controls.enabled = !event.value;
        })
        
        window.addEventListener('keydown', function (event) {
        	switch (event.key) {
        		case 'g':
        			transformControls.setMode('translate');
        			break;
        		case 'r':
        			transformControls.setMode('rotate');
        			break;
        		case 's':
        			transformControls.setMode('scale');
        			break;
        	}
        });
 
        let endEffector = probeBall;
        let base = qt3.vir.rArm[0];

     
   
        this.quaternion_prev = new Quaternion();
        this.position_prev = new Vector3();
                  
        this.quaternion_prev.copy(endEffector.quaternion);
        this.position_prev.copy(endEffector.position);

 
      
        let GC_cur = null;
        let psi_cur = 3.14;
        let T07_cur = null;
        

         

        let GCs = [
            [ 1,  1,  1],
            [ 1,  1, -1],
            [ 1, -1,  1],
            [ 1, -1, -1],

            [-1,  1,  1],
            [-1,  1, -1],
            [-1, -1,  1],
            [-1, -1, -1], 
  
        ];

  
        
        let l = [86.50, 172, 187.375, 25]; // in mm. 25 is obtained from probeBall.position.x.

        // R(z{i-1}, theta[i]) -> T(z{i-1}, d[i]) -> R(x{i}, alpha[i]) -> T(x{i}, a[i]).        
        let dh = [
                // a[i], alpha[i], d[i], theta[i]. 
                // theta[i]'s are not used, but instead we use qt3.jointAngels[].
                [0, 0, 0, 0], // not used.
                [0,  -Math.PI/2,   l[0],    ,0] ,
                [0,   Math.PI/2,   0   ,    ,0] ,
                [0,   Math.PI/2,   l[1],	,0] ,
                [0,  -Math.PI/2,   0   ,    ,0] ,
                [0,  -Math.PI/2,   l[2],    ,0] ,
                [0,   Math.PI/2,   0   ,    ,0] ,
                [0,           0,   l[3],    ,0],
        ];		

 
        // let jl = this.qt3.jl;
        let jl = [[0, 0]];
        for(let j=1;j<=7;j++){ 
             
            jl.push([180 * DEG2RAD, -180 * DEG2RAD]);
        }
 

        function dh_calc(a, alpha, d, theta){
    
            const T = new Matrix4(); 
                    
            let c_th = Math.cos(theta);
            let s_th = Math.sin(theta);
            let c_al = Math.cos(alpha);
            let s_al = Math.sin(alpha);
            
            T.set(c_th, -s_th * c_al,  s_th * s_al, a * c_th,
                s_th,  c_th * c_al, -c_th * s_al, a * s_th,
                0.0,         s_al,         c_al,      d,
                0.0,          0.0,          0.0,      1);

            return T;
            
        }

        function skew(v){

            const m = new Matrix3();

            m.set(  0, -v.z,  v.y, 
                    v.z,    0, -v.x,
                    -v.y,  v.x,    0);

            return m;
        }
        
        function vvt(v){
            
            const m = new Matrix3();

            m.set(  v.x * v.x, v.x * v.y,  v.x * v.z, 
                    v.y * v.x, v.y * v.y,  v.y * v.z,
                    v.z * v.x, v.z * v.y,  v.z * v.z);

            return m;
        }
 
        function ReferencePlane(l, dh, T07, GC){
 
            let R03_v = new Matrix3();

            let tol = 1e-6;

            let joints = new Array(8).fill(0);
 		
            const p07 = new Vector3();
            const R07 = new Matrix3();
            R07.setFromMatrix4(T07);				
            p07.setFromMatrixPosition(T07); 
            

            // p02 = [0 0 dh(1,3)]';
            const p02 = new Vector3();
            p02.set(0, 0, dh[1][2]);

            // xwt = [0 0 dh(end,3)]';
            const p67 = new Vector3();
            p67.set(0, 0, dh[7][2]);


            // p06 = p07 - pose(1:3,1:3) * p67; // wrist position from base
            const p06 = new Vector3();
            const v = new Vector3();
            v.copy(p67).applyMatrix3(R07);
            p06.copy(p07).sub(v);

            // xsw = p06 - p02;
            const p26 = new Vector3();
            p26.copy(p06).sub(p02);
             
            let p26_length = p26.length();
            let p26_length_2 = p26_length * p26_length;
            const p26_hat = new Vector3();
            p26_hat.copy(p26).normalize(); // p26_hat
 
            let lbs = l[0];
            let lse = l[1]; // upper arm length (shoulder to elbow)
            let lew = l[2]; // lower arm length (elbow to wrist)
            

            // joints(4) = elbow * acos((norm(xsw)^2 - lse^2 - lew^2)/(2*lse*lew));
            joints[4] = GC[1] * Math.acos((p26_length_2 - lse * lse - lew * lew)/(2*lse*lew));
        
            // T34 = dh_calc(dh(4,1),dh(4,2),dh(4,3),joints(4));	
            let T34 = dh_calc(dh[4][0], dh[4][1], dh[4][2], joints[4]);			
            
             
            const R34 = new Matrix3();
            R34.setFromMatrix4(T34);	
             
            v.set(0, 0, 1);
            v.cross(p26);
 
            if(v.length() > tol){

                joints[1] = Math.atan2(p26.y, p26.x);

                if(isNaN(joints[1])){
                    R03_v.elements[0] = NaN;
                    return R03_v;
                }
            }
            else{
                joints[1] = 0;
            }
 
            let r = Math.sqrt(p26.x * p26.x + p26.y * p26.y);
            
            // phi = acos((lse^2+dsw^2-lew^2)/(2*lse*dsw));				
            let phi = Math.acos((lse * lse + p26_length_2 - lew * lew)/(2*lse*p26_length));

            // joints(2) = atan2(r, xsw(3)) + elbow * phi;
            joints[2] = Math.atan2(r, p26.z) + GC[1] * phi;
            if(isNaN(joints[2])){
                R03_v.elements[0] = NaN;
                return R03_v;
            }
 
            // Lower arm transformation
            let T01 = dh_calc(dh[1][0], dh[1][1], dh[1][2], joints[1]);
            let T12 = dh_calc(dh[2][0], dh[2][1], dh[2][2], joints[2]);
            let T23_v = dh_calc(dh[3][0], dh[3][1], dh[3][2], 0); 
            
             
            // T04 = T01*T12*T23*T34;			
            const T04_v = new Matrix4(); 				
            T04_v.copy(T01).multiply(T12).multiply(T23_v).multiply(T34);
            
            const p04_v = new Vector3();
            p04_v.setFromMatrixPosition(T04_v);

            const ref_plan_vector = new Vector3();
            ref_plan_vector.copy(p04_v).sub(p02).normalize();				
            v.copy(p06).sub(p02).normalize();
            ref_plan_vector.cross(v).normalize();

            const T = new Matrix4(); 				
            T.copy(T01).multiply(T12).multiply(T23_v);						
            R03_v.setFromMatrix4(T);

            return {ref_plan_vector, R03_v};
        }
  
 
        function solve_IK(e, autoUpdate=true){                
           

            let sol = [];

            endEffector.updateWorldMatrix(true, false);
            endEffector.updateMatrixWorld();
            base.updateWorldMatrix(true, false);
            base.updateMatrixWorld();

            const T07 = new Matrix4(); 				
            T07.copy(base.matrixWorld).invert().multiply(endEffector.matrixWorld);
        
            const p07 = new Vector3();
            const R07 = new Matrix3();
            R07.setFromMatrix4(T07);				
            p07.setFromMatrixPosition(T07);
 
 

            const p02 = new Vector3();
            const p67 = new Vector3();
            p02.set(0, 0, dh[1][2]);
            p67.set(0, 0, dh[7][2]);			

            const p06 = new Vector3();
            const v = new Vector3();
            v.copy(p67).applyMatrix3(R07);
            p06.copy(p07).sub(v);

            const p26 = new Vector3();
            p26.copy(p06).sub(p02);
            
            
            let p26_length = p26.length();
            let p26_length_2 = p26_length * p26_length;
            const p26_hat = new Vector3();
            p26_hat.copy(p26).normalize(); // p26_hat
            
            let lbs = l[0];
            let lse = l[1];  
            let lew = l[2];  
            



            let phi_idx = 0; 
            let phi_pts = [];



            for(let i = 0; i >= -Math.PI; i -= Math.PI/32) {
                phi_pts.push(i);
            }            



            let validCnt = 0;

            while(validCnt == 0 && phi_idx < phi_pts.length){

                sol = [];

                let psi = phi_pts[phi_idx];
                phi_idx = phi_idx + 1;

                for(let k=0; k < 8; k++){

                
        
                    let GC = GCs[k];
                    // console.log(`: ${GC[0]}, ${GC[1]}, ${GC[2]}`);
                    let joints = new Array(8).fill(0);
    
                    joints[4] = GC[1] * Math.acos((p26_length_2 - lse * lse - lew * lew)/(2 * lse * lew));
                    
                    let T34 = dh_calc(dh[4][0], dh[4][1], dh[4][2], joints[4]);
    
                    const R34 = new Matrix3();
                    R34.setFromMatrix4(T34);	
                    
                    let {ref_plan_vector, R03_v} = ReferencePlane(l, dh, T07, GC);
                    // print_R(R03_v);
                    // console.log(`R03_v: ${R03_v}`);
                    if(!R03_v || isNaN(R03_v.elements[0])) continue;	
                    
                    let skew_p26_hat = skew(p26_hat);  
                    let vvt_p26_hat = vvt(p26_hat); 
                                                            
                    let s_mat = [];
                    let w_mat = [];
                    for(let i = 0; i < 3; i++){
                        s_mat.push(new Matrix3());
                        w_mat.push(new Matrix3());
                    }					
    
                    s_mat[0].copy(skew_p26_hat).multiply(R03_v);
                    s_mat[1].copy(s_mat[0]).premultiply(skew_p26_hat).multiplyScalar(-1);
                    s_mat[2].copy(vvt_p26_hat).multiply(R03_v);
    
                    w_mat[0].copy(s_mat[0]).multiply(R34).transpose().multiply(R07);
                    w_mat[1].copy(s_mat[1]).multiply(R34).transpose().multiply(R07);
                    w_mat[2].copy(s_mat[2]).multiply(R34).transpose().multiply(R07);					
                
                
                    const m = new Matrix3();
            
                    const R03 = new Matrix3();
                    m.copy(s_mat[1]).multiplyScalar(Math.cos(psi));
                    R03.copy(s_mat[0]).multiplyScalar(Math.sin(psi)).add(m).add(s_mat[2]);
                
                    joints[1] = Math.atan2(GC[0] * R03.get(1,1), GC[0] * R03.get(0,1));
                    joints[2] = GC[0] * Math.acos(R03.get(2,1));
                    joints[3] = Math.atan2(GC[0] * -R03.get(2,2), GC[0] * -R03.get(2,0));
    
                    const R47 = new Matrix3(); 
                    m.copy(w_mat[1]).multiplyScalar(Math.cos(psi));
                    R47.copy(w_mat[0]).multiplyScalar(Math.sin(psi)).add(m).add(w_mat[2]);
                                        
                    joints[5] = Math.atan2(GC[2] * R47.get(1,2), GC[2] * R47.get(0,2));
                    joints[6] = GC[2] * Math.acos(R47.get(2,2));
                    joints[7] = Math.atan2(GC[2] * R47.get(2,1), GC[2] * (-R47.get(2,0)));										
            
                    
                    sol.push({'GC': GC, 'psi': psi, 'joints': joints, 'valid': true});
                }
    
           
    
                // check validity (NaN & joint limits) for each solution.                
                for (let i = 0; i < sol.length; i++)
                {					
                    // console.log(`sol.length: ${sol.length}`);
          
                                
                    for (let j = 1; j <= 6; j++) // j=0 is dummy. j=7 don't need to check.
                    {		
                        if(isNaN(sol[i]['joints'][j])){
                             
                            sol[i]['valid'] = false;
                            break;
                        }

                        let ja = sol[i]['joints'][j]*RAD2DEG + scope.qt3.vir.ja_homeOffset[j];
                        if(ja > 180)  ja = -180 + (ja - 180);  
                        if(ja < -180) ja = 180 + (ja + 180);

                        if (ja > scope.qt3.jl[j][1] || ja < scope.qt3.jl[j][0])
                        {
                             
                            sol[i]['valid'] = false;
                            break;
                        }	
 		
                    }					
        
                    if (sol[i]['valid']) validCnt++;
                }
    
    
            }
 
             if(validCnt == 0){
                endEffector.quaternion.setFromRotationMatrix(scope.qt3.vir.rArm[7].matrixWorld);
                endEffector.position.setFromMatrixPosition(scope.qt3.vir.rArm[7].matrixWorld);
                
                return null;
            }
 
              // Try to find the smoothest, least jumpy solution.				
            let minmax = 10000;
            let minmaxIdx;
            let max;
            let delta;
        
            for(let i = 0; i < sol.length; i++){
    
                if(sol[i]['valid']){ // if solution is valid.	

                    max = -1;		
                    for(let j = 1; j <= 6; j++){
        
                        let ja = sol[i]['joints'][j]*RAD2DEG + scope.qt3.vir.ja_homeOffset[j];

                        // delta = Math.abs(sol[i]['joints'][j]*RAD2DEG - qt3.vir.ja[j]);			

                        delta = Math.abs(ja - qt3.vir.getAngle(j));			
                        
                        if(delta > max) max = delta;								
                    }
                }
        
                if(max < minmax){
                    minmax = max;
                    minmaxIdx = i;
                }
            }
         
         
            let jaWithHomeOffset = [0];
            for(let i = 1; i <= 6; i++){  
                let ja = sol[minmaxIdx]['joints'][i]*RAD2DEG + scope.qt3.vir.ja_homeOffset[i];
                if(ja > 180)  ja = -180 + (ja - 180);  
                if(ja < -180) ja = 180 + (ja + 180);
                jaWithHomeOffset.push(ja);  
            }
 
            
         
                       
            if(autoUpdate)
                scope.qt3.setAnglesTimeAligned(ctrlName, jaWithHomeOffset, null);


            psi_cur = sol[minmaxIdx]['psi'];											
            T07_cur = T07;
            GC_cur = sol[minmaxIdx]['GC'];		

            return jaWithHomeOffset;
        } // end solve_IK

 
 
        transformControls.addEventListener(_objectChangeEvent.type, solve_IK); 
        this.transformControls = transformControls;

        this.solve_IK = solve_IK.bind( this );
     }
 

    syncUpdate(j, angleNext, callerName){    
       
        if(callerName == ctrlName) return;

        this.qt3.vir.rArm[7].updateWorldMatrix(true, false);
        this.qt3.vir.rArm[7].updateMatrixWorld();
        this.probeBall.quaternion.setFromRotationMatrix(this.qt3.vir.rArm[7].matrixWorld);
        this.probeBall.position.setFromMatrixPosition(this.qt3.vir.rArm[7].matrixWorld);  

    } 

} 
export { TransformCtrl };





 