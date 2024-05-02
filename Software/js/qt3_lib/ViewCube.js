
import {
	EventDispatcher,
 	Mesh,
    MeshBasicMaterial,
	BoxGeometry,
    Object3D,
	Quaternion,
	Vector2,
    Raycaster,
	Vector3,
    Matrix3
} from 'three';
import { Tween, SchedMode } from './Tween.js';


const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;


const print_p = (prefix, p) =>{

    console.log(`[${prefix}] p: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);
}

const print_q = (prefix, q) =>{

    console.log(`[${prefix}] q: ${q._x.toFixed(2)}, ${q._y.toFixed(2)}, ${q._z.toFixed(2)}, ${q._w.toFixed(2)}`);
}


class ViewCube{
    
    constructor(qt3) {

        this.qt3 = qt3;

        

        let renderer = qt3.renderer;

        this.m_scene = renderer.scenes['model'];
        this.v_scene = renderer.scenes['viewCube'];

        this.m = renderer.scenes['model'].userData;
        this.v = renderer.scenes['viewCube'].userData;
 
        this.v.element.style.zIndex = 1;
 
        let scope = this;
         

        this.qrot_ctrl = new QuarterRotateControl(this, this.v, this.m);

        this.add_gizmo();    
  

        this.m.controls.addEventListener("change", function(){scope.update_v()});
        this.v.controls.addEventListener("change", function(){scope.update_m()}); 
        this.update_v();

 
 

        const mouse = new Vector2();
        const raycaster = new Raycaster();
        let INTERSECTED;
        let isMouseDown = false, isDragging = false;

        this.tween = new Tween();
        this.intervalId = null;


        function onPointerMove( event ) {
          
            
            if(isMouseDown) isDragging = true;
            else isDragging = false;

            if(isDragging){                 
                
                scope.v.element.style.cursor = "grabbing"; 

                if ( INTERSECTED ) scope.set_gizmo_opacity(INTERSECTED, 0);
                INTERSECTED = null;    

                return;
            }

            

            event.preventDefault();
 
            let rect = scope.v.element.getBoundingClientRect(); 
            let w = rect.right - rect.left;
            let h = rect.bottom - rect.top;
 
            mouse.x = ( (event.clientX - rect.left) / w ) * 2 - 1;
            mouse.y = - ( (event.clientY - rect.top) / h ) * 2 + 1;
 
            scope.v.camera.updateMatrixWorld();  
            raycaster.setFromCamera( mouse, scope.v.camera );
 
            const intersects = raycaster.intersectObjects( scope.gizmo.children, false );
 
            if ( intersects.length > 0 ) {

                scope.v.element.style.cursor = "pointer";
                 
                if ( INTERSECTED != intersects[ 0 ].object ) {
 
                    if ( INTERSECTED ) { 
                        scope.set_gizmo_opacity(INTERSECTED, 0);
                       
                    }
  
                    INTERSECTED = intersects[ 0 ].object.name;  
                    scope.set_gizmo_opacity(INTERSECTED, 0.3);  
                }

            } 
            else {

                scope.v.element.style.cursor = "default";
 
                if ( INTERSECTED ) scope.set_gizmo_opacity(INTERSECTED, 0);

                INTERSECTED = null;
                
            }      
            
		}

  
        function onPointerDown( event ) {

            isMouseDown = true;

            scope.v.element.style.cursor = "grabbing";

        } 

        function onPointerUp( event ) {
            
            isMouseDown = false;
            scope.v.element.style.cursor = "default";
            
            if(!isDragging && INTERSECTED){

                let v = scope.v;
                let m = scope.m;    
                let pose = scope.cameraPoseMap[INTERSECTED]; 
                                 
                let begin = new Vector3(), end = new Vector3();
                begin.copy(m.camera.position);            
                // let end = pose.position;
                end.copy(pose.position).multiplyScalar(begin.length());

                scope.switchView(begin, end);   
            }


            isDragging = false;
    
    
        }


        this.onPointerMove = onPointerMove.bind( this );
        this.onPointerDown = onPointerDown.bind( this );
        this.onPointerUp = onPointerUp.bind( this );
    
        this.v.element.addEventListener( 'mouseup', onPointerUp);
        this.v.element.addEventListener( 'mousedown', onPointerDown);
        this.v.element.addEventListener( 'pointermove', onPointerMove );
        
  

    }

    
    switchView(p1, p2){ 
 
        let dir1 = new Vector3();
        let dir2 = new Vector3();
        
        if(p1 == null){
            p1 = new Vector3();
            p1.copy(this.qt3.scene.userData.camera.position);
        }
        
        dir1.copy(p1).normalize();
        dir2.copy(p2).normalize();

        let v = this.v;
        let m = this.m; 
  
        let x_hat = new Vector3();
        let y_hat = new Vector3();
        let z_hat = new Vector3();
        
        x_hat.copy(dir1);
        z_hat.crossVectors(dir1, dir2).normalize();
        y_hat.crossVectors(z_hat, x_hat).normalize();

        let R0 = new Matrix3(
            x_hat.x, y_hat.x, z_hat.x,
            x_hat.y, y_hat.y, z_hat.y,
            x_hat.z, y_hat.z, z_hat.z,
        ); 



        let n = 20;
        let a = Math.acos(Math.min(Math.max(dir1.dot(dir2), -1), 1)); // radian 
            
        let scope = this;

        this.tween.newSchedule(0, 0, a, n, SchedMode.EXPONENTIAL_INOUT);
        this.tween.start(0, 20, function(a){ 
                     
        
            let R = new Matrix3(); 
            R.set(

                Math.cos(a), -Math.sin(a), 0,
                Math.sin(a), Math.cos(a), 0,
                0, 0, 1
            );


            let dir = new Vector3(1, 0, 0);
            dir.applyMatrix3(R).applyMatrix3(R0).normalize();


            let vlen = v.camera.position.length();
            let mlen = m.camera.position.length();

            v.camera.position.copy(dir).multiplyScalar(vlen);
            m.camera.position.copy(dir).multiplyScalar(mlen);

            v.controls.update();
            m.controls.update();
            

            if(scope.tween.done(0)){
                clearInterval(scope.intervalId);
            }                  
             
        });

        this.tween.newSchedule(1, p1.length(), p2.length(), n, SchedMode.EXPONENTIAL_INOUT);
        this.tween.start(1, 20, function(r){ 
             
            let mlen = m.camera.position.length();
            m.camera.position.multiplyScalar(r/mlen);
            m.controls.update();            
             
        });
 
    }
 

    set_gizmo_opacity(name, opacity){
 

        this.gizmoMap[name].forEach((obj, i) => {

            obj[0].material.opacity = opacity;
        });

    }
 


    update_v(){ 
  
        let v = this.v;
        let m = this.m;
        
        let vlen = v.camera.position.length();
        let mlen = m.camera.position.length();
 
        v.camera.position.copy(m.camera.position).multiplyScalar(vlen/mlen);
        v.camera.quaternion.copy(m.camera.quaternion);
      
    }



    update_m(){ 
 
        let v = this.v;
        let m = this.m;
        
        let vlen = v.camera.position.length();
        let mlen = m.camera.position.length();
 

        m.camera.position.copy(v.camera.position).multiplyScalar(mlen/vlen);
        m.camera.quaternion.copy(v.camera.quaternion);
       
    }   

 



    add_gizmo(){
	
		const gizmoMaterial = new MeshBasicMaterial( {
			depthTest: false,
			depthWrite: false,
			fog: false,
			toneMapped: false,
			transparent: true
		} );



		const matBlueTransparent = gizmoMaterial.clone();
		matBlueTransparent.color.setHex( 0x0000ff );
		matBlueTransparent.opacity = 0;

        const matRedTransparent = matBlueTransparent.clone();
        const matGreenTransparent = matBlueTransparent.clone();
 


        const gizmo_faces = {
            f: [
                [ new Mesh( new BoxGeometry( 0.7, 0.7, 0.01 ), matBlueTransparent.clone() ), [ 0.5, 0.5, 0 ]]
            ],
            b: [
                [ new Mesh( new BoxGeometry( 0.7, 0.7, 0.01 ), matBlueTransparent.clone() ), [ 0.5, 0.5, 1 ]]
            ],
            
            
            r: [
                [ new Mesh( new BoxGeometry( 0.7, 0.7, 0.01 ), matBlueTransparent.clone() ), [ 0, 0.5, 0.5 ], [ 0, Math.PI / 2, 0 ]]
            ],
            l: [
                [ new Mesh( new BoxGeometry( 0.7, 0.7, 0.01 ), matBlueTransparent.clone() ), [ 1, 0.5, 0.5 ], [ 0, Math.PI / 2, 0 ]]
            ],
            
            
            t: [
                [ new Mesh( new BoxGeometry( 0.7, 0.7, 0.01 ), matBlueTransparent.clone() ), [ 0.5, 1, 0.5 ], [ - Math.PI / 2, 0, 0 ]]
            ],   

            m: [ // bottom
                [ new Mesh( new BoxGeometry( 0.7, 0.7, 0.01 ), matBlueTransparent.clone() ), [ 0.5, 0, 0.5 ], [ - Math.PI / 2, 0, 0 ]]
            ]

 
        }



        
        const gizmo_edges = {
         

            fl: [
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 1-0.15/2, 0.5,  0 ]] ,
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 1, 0.5, 0.15/2 ], [ 0, Math.PI / 2, 0 ]]
             
            ],
            lb: [
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 1, 0.5, 1-0.15/2 ], [ 0, Math.PI / 2, 0 ]],
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 1-0.15/2, 0.5,  1 ]]            
            ],   
            br: [
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 0, 0.5, 1-0.15/2 ], [ 0, Math.PI / 2, 0 ]],
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 0.15/2, 0.5,  1 ]]            
            ],     
            rf: [
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 0.15/2, 0.5,  0 ]] ,
                [ new Mesh( new BoxGeometry( 0.15, 0.7, 0.01 ), matGreenTransparent.clone() ), [ 0, 0.5, 0.15/2 ], [ 0, Math.PI / 2, 0 ]]
             
            ],   
            
            


            ft: [
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 1-0.15/2 ,  0 ]] , 
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 1, 0.15/2 ], [ - Math.PI / 2, 0, 0 ]] 
            ],        
            tb: [
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 1, 1-0.15/2 ], [ - Math.PI / 2, 0, 0 ]] ,
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 1-0.15/2 ,  1 ]] , 

            ],    
            bm: [
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 0.15/2 ,  1 ]] ,                 
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 0, 1-0.15/2 ], [ - Math.PI / 2, 0, 0 ]] ,


            ],        
            mf: [
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 0, 0.15/2 ], [ - Math.PI / 2, 0, 0 ]] ,

                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.5, 0.15/2 ,  0 ]] ,     
            ],       
            
            

            lt:[
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 1, 1-0.15/2, 0.5 ], [ 0, Math.PI / 2, 0 ]],  
                [ new Mesh( new BoxGeometry(0.15,  0.7, 0.01 ), matGreenTransparent.clone() ), [ 1-0.15/2, 1, 0.5 ], [ - Math.PI / 2, 0, 0 ]]
            ],

            tr:[
                [ new Mesh( new BoxGeometry(0.15,  0.7, 0.01 ), matGreenTransparent.clone() ), [ 0.15/2, 1, 0.5 ], [ - Math.PI / 2, 0, 0 ]],
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0, 1-0.15/2, 0.5 ], [ 0, Math.PI / 2, 0 ]]
                
            ],  
            
            
            rm:[
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0, 0.15/2, 0.5 ], [ 0, Math.PI / 2, 0 ]],                
                [ new Mesh( new BoxGeometry(0.15,  0.7, 0.01 ), matGreenTransparent.clone() ), [ 0.15/2, 0, 0.5 ], [ - Math.PI / 2, 0, 0 ]]  
            ],   

            ml:[
                [ new Mesh( new BoxGeometry(0.15,  0.7, 0.01 ), matGreenTransparent.clone() ), [1- 0.15/2, 0, 0.5 ], [ - Math.PI / 2, 0, 0 ]]  ,
                [ new Mesh( new BoxGeometry( 0.7, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 1, 0.15/2, 0.5 ], [ 0, Math.PI / 2, 0 ]]               
                
            ]
        }

        const gizmo_corners = {
         

            lft: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1, 1-0.15/2, 0.15/2 ], [ 0, Math.PI / 2, 0 ]],

                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 1-0.15/2,  0 ]] ,

                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 1, 0.15/2 ], [ - Math.PI / 2, 0, 0 ]]
            ],

            ltb: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1, 1-0.15/2, 1-0.15/2 ], [ 0, Math.PI / 2, 0 ]], 
                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 1, 1-0.15/2 ], [ - Math.PI / 2, 0, 0 ]], 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 1-0.15/2,  1 ]] ,
            ],        
            
            lbm: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1, 0.15/2, 1-0.15/2 ], [ 0, Math.PI / 2, 0 ]], 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 0.15/2,  1 ]] ,
                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 0, 1-0.15/2 ], [ - Math.PI / 2, 0, 0 ]], 
            ],  
            
            lmf: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1, 0.15/2, 0.15/2 ], [ 0, Math.PI / 2, 0 ]],  
                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 0, 0.15/2 ], [ - Math.PI / 2, 0, 0 ]], 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 1-0.15/2, 0.15/2,  0 ]] ,                
            ],        
            
            

            rft: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0, 1-0.15/2, 0.15/2 ], [ 0, Math.PI / 2, 0 ]],

                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 1-0.15/2,  0 ]] ,

                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 1, 0.15/2 ], [ - Math.PI / 2, 0, 0 ]]
            ],

            rtb: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0, 1-0.15/2, 1-0.15/2 ], [ 0, Math.PI / 2, 0 ]], 
                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 1, 1-0.15/2 ], [ - Math.PI / 2, 0, 0 ]], 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 1-0.15/2,  1 ]] ,
            ],        
            
            rbm: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0, 0.15/2, 1-0.15/2 ], [ 0, Math.PI / 2, 0 ]], 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [0.15/2, 0.15/2,  1 ]] ,
                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 0, 1-0.15/2 ], [ - Math.PI / 2, 0, 0 ]], 
            ],  
            
            rmf: [ 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [0, 0.15/2, 0.15/2 ], [ 0, Math.PI / 2, 0 ]],  
                [ new Mesh( new BoxGeometry(0.15,  0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 0, 0.15/2 ], [ - Math.PI / 2, 0, 0 ]], 
                [ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0.15/2, 0.15/2,  0 ]] ,                
            ],               
        }

        // let food = Object.assign({}, a, b);

        this.gizmoMap =  Object.assign({}, gizmo_faces, gizmo_edges, gizmo_corners);

        
        this.cameraPoseMap = {
            l: {
                position: new Vector3(1, 0, 0)
            },
            r: {
                position: new Vector3(-1, 0, 0) 
            },
            t: {
                position: new Vector3(0, 1, 0) 
            },
            m: {
                position: new Vector3(0, -1, 0)
            },
            f: {
                position: new Vector3(0, 0, -1)
            },
            b: {
                position: new Vector3(0, 0, 1)
            },




            fl: {
                position: new Vector3(0.70711, 0, -0.70711)
            },
            lb: {
                position: new Vector3(0.70711, 0, 0.70711)
            },   
            br: {
                position: new Vector3(-0.70711, 0, 0.70711)
            },     
            rf: {
                position: new Vector3(-0.70711, 0, -0.70711)
            },    

            ft: {
                position: new Vector3(0, 0.70711, -0.70711)
            },        
            tb: {
                position: new Vector3(0, 0.70711, 0.70711)
            },    
            bm: {
                position: new Vector3(0, -0.70711, 0.70711)
            },        
            mf: {
                position: new Vector3(0, -0.70711, -0.70711)
            },

            lt:{
                position: new Vector3(0.70711, 0.70711, 0)
            },
            tr:{
                position: new Vector3(-0.70711, 0.70711, 0)
            },  
            rm:{
                position: new Vector3(-0.70711, -0.70711, 0)
            },   
            ml:{
                position: new Vector3(0.70711, -0.70711, 0)
            },

 

            ltb: {
                position: new Vector3(0.57735, 0.57735, 0.57735)
            },
            lbm: {
                position: new Vector3(0.57735, -0.57735, 0.57735)
            },
            lmf: {
                position: new Vector3(0.57735, -0.57735, -0.57735)
            },
            lft: {
                position: new Vector3(0.57735, 0.57735, -0.57735)
            },     
            rtb: {
                position: new Vector3(-0.57735, 0.57735, 0.57735)
            },
            rbm: {
                position: new Vector3(-0.57735, -0.57735, 0.57735)
            },
            rmf: {
                position: new Vector3(-0.57735, -0.57735, -0.57735)
            },
            rft: {
                position: new Vector3(-0.57735, 0.57735, -0.57735)
            },                                 
        }


        this.gizmo = new Object3D();
        this.v_scene.add(this.gizmo);

        this.setupGizmo(this.gizmo, gizmo_faces);
        this.setupGizmo(this.gizmo, gizmo_edges);
        this.setupGizmo(this.gizmo, gizmo_corners);
    }




    setupGizmo( scene, gizmoMap ) {
  

        for ( const name in gizmoMap ) {

            for ( let i = gizmoMap[ name ].length; i --; ) {

                // const object = gizmoMap[ name ][ i ][ 0 ].clone();
                const object = gizmoMap[ name ][ i ][ 0 ];
                const position = gizmoMap[ name ][ i ][ 1 ];
                const rotation = gizmoMap[ name ][ i ][ 2 ];

                object.name = name;
             

                if ( position ) {

                    object.position.set( position[ 0 ], position[ 1 ], position[ 2 ] );

                }

                if ( rotation ) {

                    object.rotation.set( rotation[ 0 ], rotation[ 1 ], rotation[ 2 ] );

                }


                object.updateMatrix();

                const tempGeometry = object.geometry.clone();
                tempGeometry.applyMatrix4( object.matrix );
                object.geometry = tempGeometry;
                object.renderOrder = Infinity;

                // object.position.set( 0, 0, 0 );
                object.position.set( -0.5,-0.5,-0.5);
                object.rotation.set( 0, 0, 0 );
                object.scale.set( 1, 1, 1 );

                scene.add( object );

            }

        }
 
    }

    
}


class QuarterRotateControl {

	constructor(viewCubeCtrl, v, m) {
 

        let container = document.createElement('div'); 
        container.style.position = `absolute`;
        // container.style.zIndex = 1;
      

        const canvas = document.createElement('canvas');            
        canvas.width = 250;
        canvas.height = 250;
 
        container.style.right = `${50 + 200/2 - canvas.width/2}px`;
        container.style.top = `${50 + 200/2 - canvas.width/2}px`;

 

        container.appendChild(canvas);
 
        let dashboard = document.querySelector('.dashboard');  
        dashboard.appendChild(container); 

        const ctx = canvas.getContext('2d');
 

        let w = canvas.width;
        let h = canvas.height;
        let cx = w/2;
        let cy = w/2;
 
        let w_face = 115;
        let h_face = 115;
 
        let wing_arrow = 6;
        let head_arrow = 12; 
        let cx_arrow = cx + w_face/4;
        let cy_arrow = cy - h_face/4;
 
        let w_arrow = 12;

  


        let r2_arrow = 0.7 * w_face;
        let r1_arrow = r2_arrow - w_arrow; 
        let a1_arrow = -0.3 * Math.PI;
        let a2_arrow = -0.5 * Math.PI; 

        
        let arrowCfgs = {
            up: {
                r2: 0.7 * w_face,
                r1: r2_arrow - w_arrow,
                a1: -0.3 * Math.PI,
                a2: -0.5 * Math.PI   
            },

            down: {
                r2: 0.7 * w_face,
                r1: r2_arrow - w_arrow,
                a1: -0.2 * Math.PI,
                a2: 0   
            }       
        }
 

        let x_last, y_last, x_first, y_first;

        function arc(path, xc, yc, r, a0, a1, ccw, isfirst){
    
            path.arc(xc, yc, r, a0, a1, ccw);

            if(isfirst){
            
                x_first = xc + r * Math.cos(a0);
                y_first = yc + r * Math.sin(a0); 
            }


            x_last = xc + r * Math.cos(a1);
            y_last = yc + r * Math.sin(a1);   

        }


        function lineTo_delta(path, dx, dy){

            path.lineTo(x_last + dx, y_last + dy);

            x_last = x_last + dx;
            y_last = y_last + dy;  
        }


        function lineTo(path, x, y){

            path.lineTo(x, y);

            x_last = x;
            y_last = y;  
        }
 
 

        const pathUp = new Path2D();
        const pathDown = new Path2D();

        function drawUpArrow(ctx){ 
             
            arc(pathUp, cx_arrow, cy_arrow, r2_arrow, a1_arrow, a2_arrow, true, true);
            lineTo_delta(pathUp, 0, -wing_arrow);
            lineTo_delta(pathUp, -head_arrow, wing_arrow + w_arrow/2);
            lineTo_delta(pathUp, head_arrow, w_arrow/2 + wing_arrow);
            lineTo_delta(pathUp, 0, -w_arrow/2);
            arc(pathUp, cx_arrow, cy_arrow, r1_arrow, a2_arrow, a1_arrow, false, false);  
            lineTo(pathUp, x_first, y_first);
            pathUp.closePath();  
        }

        function drawDownArrow(ctx){

            let cfg = arrowCfgs.down; 

            arc(pathDown, cx_arrow, cy_arrow, cfg.r2, cfg.a1, cfg.a2, false, true);
            lineTo_delta(pathDown, wing_arrow, 0);
            lineTo_delta(pathDown, -wing_arrow - w_arrow/2, head_arrow);
            lineTo_delta(pathDown, -wing_arrow - w_arrow/2, -head_arrow);
            lineTo_delta(pathDown, wing_arrow, 0);
            arc(pathDown, cx_arrow, cy_arrow, cfg.r1, cfg.a2, cfg.a1, true, false);  
            lineTo(pathDown, x_first, y_first);
            pathDown.closePath(); 
        }
 
        drawUpArrow(ctx);
        drawDownArrow(ctx);

        let arrows = {
            up: pathUp,
            down: pathDown,
        }

        function strokeArrow(name){
            ctx.strokeStyle = "rgb(0,255,255)";
            ctx.shadowColor="rgb(0,255,255)"; 
            ctx.shadowBlur=1;
            ctx.lineWidth=1;
            ctx.stroke(arrows[name]);  
        }

        function fillArrow(name){
            ctx.fillStyle = "rgb(0,155,155)";
            ctx.fill(arrows[name]); 
        }

        strokeArrow('up');
        strokeArrow('down');

   
        this.tween = new Tween();
        this.intervalId = null;

        let scope = this;
        let INTERSECTED;

        function isHoverArrow(name, r, a){

            let cfg = arrowCfgs[name];

            let dw = (cfg.r2 - cfg.r1)*(2.5-1)/2;
            let da = (Math.abs(cfg.a2 - cfg.a1)/2)*(1.2-1)/2;

            if(cfg.a2 < cfg.a1)
                return r > cfg.r1 - dw && r < cfg.r2 + dw && a > cfg.a2 - da && a < cfg.a1 + da;
            else
                return r > cfg.r1 - dw && r < cfg.r2 + dw && a > cfg.a1 - da && a < cfg.a2 + da;
        }

        

        function onPointerMove(event){

            event.preventDefault();
 
            let rect = container.getBoundingClientRect(); 
       
            let x =event.clientX - rect.left - cx_arrow;
            let y = event.clientY - rect.top - cy_arrow;

            let a = Math.atan2(y, x);
            let r = Math.sqrt(x*x + y*y);

        
            ctx.clearRect(0, 0, canvas.width, canvas.height);                
            strokeArrow('up');             
            strokeArrow('down'); 


            if(isHoverArrow('up', r, a)){
                container.style.cursor = "pointer";

                INTERSECTED = 'up';

               
                fillArrow('up');
 
                 
            }
            else if(isHoverArrow('down', r, a)){

                container.style.cursor = "pointer";

                INTERSECTED = 'down';

           
                fillArrow('down'); 
            }
            else{
 
                container.style.cursor = "default";
                INTERSECTED = null;
 
            }
        } 

        
        function onPointerDown(event){ 

        }
   
        function onPointerUp(event){ 

            if(INTERSECTED){
                
                let f;
                if(INTERSECTED == 'up') f = -1;
                else f = +1;

                let rotAxis = new Vector3();
                rotAxis.copy(v.camera.position).normalize();
   
                let q0 = new Quaternion();
                q0.copy(v.camera.quaternion);

        
                scope.tween.newSchedule(0, 0, Math.PI / 2, 20, SchedMode.EXPONENTIAL_INOUT);
    
                clearInterval(scope.intervalId);
    
                scope.intervalId = setInterval(
                    function() {
        
                        v.camera.quaternion.copy(q0);
                        m.camera.quaternion.copy(q0);


                        let a = f*scope.tween.step(0);
                          

                        v.camera.rotateOnWorldAxis( rotAxis, a); 
                        m.camera.rotateOnWorldAxis( rotAxis, a);                        
                        
    
                        if(scope.tween.done(0)){
                            clearInterval(scope.intervalId);
                        }
                    }, 
                    30 // ms.
                );                   
            }
  
        }

        
        function onPointerLeave(event){
            // console.log(`a`);
            container.style.cursor = "default";
            INTERSECTED = null;

            ctx.clearRect(0, 0, canvas.width, canvas.height);                
            strokeArrow('up');             
            strokeArrow('down'); 
        }

        container.addEventListener('pointermove', onPointerMove);
 
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointerup', onPointerUp);

        container.addEventListener("mouseleave", onPointerLeave);



    }




}











 

export { ViewCube }

