

// import html2canvas from 'html2canvas';
import {
 
	Vector3,
    Quaternion,
    CatmullRomCurve3,
    MeshLambertMaterial,
    MeshBasicMaterial,
    TubeGeometry,
    Object3D,
    Mesh,
    Matrix4,
    Euler,
    SphereGeometry,
    LineSegments,
    Color,
    CylinderGeometry,
    
    BufferGeometry,
    Float32BufferAttribute,
    LineBasicMaterial,
     

} from 'three';

import { Tween, SchedMode } from './Tween.js';


import { ResizableTable } from './ResizableTable.js';
import { TabHelper } from './TabHelper.js';
import { UserMode } from './QT3.js';
// import { LinkFrameHelper } from './QT3vir.js';





class LinkFrameHelper extends LineSegments {

    // frameOrigin: inst of class Vector3.
    constructor(matrixWorld, L=30) {

        let frameOrigin = new Vector3(0,0,0);
        let xAxis = new Vector3(L,0,0);
        let yAxis = new Vector3(0,L,0);
        let zAxis = new Vector3(0,0,L);
        frameOrigin.applyMatrix4(matrixWorld);
        xAxis.applyMatrix4(matrixWorld);
        yAxis.applyMatrix4(matrixWorld);
        zAxis.applyMatrix4(matrixWorld);


        
        const x0 = frameOrigin.x;
        const y0 = frameOrigin.y;
        const z0 = frameOrigin.z;
         

        const vertices = [], colors = [];

        let j = 0;
 

        vertices.push( x0, y0, z0,  xAxis.x,  xAxis.y,  xAxis.z);
        vertices.push( x0, y0, z0,  yAxis.x,  yAxis.y,  yAxis.z);
        vertices.push( x0, y0, z0,  zAxis.x,  zAxis.y,  zAxis.z);



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
        
 
        const gizmoMaterial = new MeshBasicMaterial( {
            transparent: true
        } ); 
        gizmoMaterial.color.setHex( 0xff0000 );
        gizmoMaterial.opacity = 0.8;
        const ball = new Mesh(new SphereGeometry(L/10), gizmoMaterial); 
        ball.position.copy(frameOrigin);  
        this.add(ball);

        

    }

    dispose() {

        this.geometry.dispose();
        this.material.dispose();

    }

}





const print_p = (p, prefix="") =>{

    console.log(`[${prefix}] p: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);
}

const print_q = (prefix, q) =>{

    console.log(`[${prefix}] q: ${q._x.toFixed(2)}, ${q._y.toFixed(2)}, ${q._z.toFixed(2)}, ${q._w.toFixed(2)}`);
}








class KeyFrameEditor {
 
    constructor(qt3) {

        this.qt3 = qt3;
    
        var scope = this; 

        let cfg = {
            pos: {left: 500, bottom: 70},
            width: '1450px', 
            height: '260px',
            titleSz: '40px' 
        };
  
        this.dashboard = document.querySelector('.dashboard');   

        this.kfEditor = document.createElement('div');
        this.kfEditor.classList.add('keyFrameEditor');
        this.dashboard.appendChild(this.kfEditor);

 
        this.kfEditor.innerHTML = `
            

            <div class="toolbar">  
  
                <div class="scrollBox"></div>  

                <div class="shadow-top"></div>
                <div class="cardTrack"></div> 
                <div class="shadow-bottom"></div>

            </div>`;
 
        this.kfEditor.style.setProperty('--w', `${window.innerWidth*0.6}px`);
        this.kfEditor.style.setProperty('--h', `${window.innerHeight*0.2}px`); 

        
        this.cfg = cfg;                   
   
     
        
        this.scrollBox = this.kfEditor.querySelector('.scrollBox');
     
        
        this.btn={};
 

        // this.cardScrollWidth = null;
        this.selectedCard = null;
        this.nCard = 0;

 
        var kfcard = document.createElement("div");
        kfcard.classList.add('card');
        this.scrollBox.appendChild(kfcard);

         
        this.compute_scrollWidth();
 

        this.add_scrollSpacer(kfcard);
        
       
        this.scrollBox.removeChild(kfcard);
      

        this.infoTabs = new InfoTabs(this, this.kfEditor);

   
 
        let j0;
        setTimeout(()=> {
            scope.insert(); 

        } ,900); 



      

        this.tween = new Tween();
        this.kfcardMeta = {};
        this.kfcardInfo = {};
        
 
 
        this.add_hotKey('shift', 'a', function(){
            scope.insert();
        })

        this.add_hotKey('shift', 'd', function(){
            scope.remove();
        }) 
        
        this.add_hotKey('shift', 'p', function(){
            scope.play();
        })   

 

        this.trajetoryHelper = new TrajectoryHelper(this, this.qt3);
        
    } 

    
 
    onWindowResize(){
 
        this.kfEditor.style.setProperty('--w', `${window.innerWidth*0.6}px`);

        let h = window.innerHeight*0.2;
        this.kfEditor.style.setProperty('--h', `${h}px`);
      
  
        this.spacerWidth = this.compute_scrollSpacer_width(); 
        this.scrollSpacer.style.width = `${this.spacerWidth}px`;
 
        this.infoTabs.onWindowResize();
    }

    setPos(pos){ 
        this.cfg.pos = pos;

        this.kfEditor.style.setProperty('--left', `${pos.left}px`);
        this.kfEditor.style.setProperty('--top', `${pos.top}px`);
                             
        this.dragHandle.style.left = `${pos.left}px`;
        this.dragHandle.style.top = `${pos.top}px`; 
    }


    compute_scrollWidth(){ 
        var kfcard = document.createElement("div");
        kfcard.classList.add('card');
        this.scrollBox.appendChild(kfcard); 
         

        let width = window.getComputedStyle(kfcard).getPropertyValue('width');
        let borderWidth = window.getComputedStyle(kfcard).getPropertyValue('border-width');
        let marginTop = window.getComputedStyle(kfcard).getPropertyValue('margin-left');
         
        width = parseInt(width.split('px')[0]);
        borderWidth = parseInt(borderWidth.split('px')[0]);
        marginTop = parseInt(marginTop.split('px')[0]);

        this.cardScrollWidth = width + 2*borderWidth + 2*marginTop;
    

        this.scrollBox.removeChild(kfcard);
    }

    add_scrollSpacer(kfcard){  
        this.spacerWidth = this.compute_scrollSpacer_width();
  
        this.scrollSpacer = document.createElement("div");
        this.scrollSpacer.classList.add('scroll-spacer');        
        this.scrollSpacer.style.width = `${this.spacerWidth}px`; 
        this.scrollBox.appendChild(this.scrollSpacer);
    }

    compute_scrollSpacer_width(){


        let old = this.scrollBox.scrollLeft;
        this.scrollBox.scrollLeft = 0;
 

        let kfcard = document.createElement("div");
        kfcard.classList.add('card');
        

        let firstChild = this.scrollBox.firstChild;
        if(firstChild){
            firstChild.before(kfcard);
        }
        else{
            this.scrollBox.appendChild(kfcard);
        }

        let marginLeft = window.getComputedStyle(kfcard).getPropertyValue('margin-left'); 

        
        marginLeft = parseInt(marginLeft.split('px')[0]);

        let right1 = this.scrollBox.getBoundingClientRect().right;
        let right2 = kfcard.getBoundingClientRect().right;
      

        this.scrollBox.scrollLeft = old;

        this.scrollBox.removeChild(kfcard);


        return Math.abs(right2 - right1)-marginLeft;
    }



    add_alt(element, txt){
            
        let alt = document.createElement('div');            
        alt.classList.add('alt-hide-state'); 
        alt.innerHTML = txt;
        element.after(alt)

        let alt_enabled = true;

            
        let left = window.getComputedStyle(element).getPropertyValue('left');            
            
        alt.style.left = `calc(${left} + 60px)`;
       
        element.addEventListener('click',  
            function (){ 
                
                alt_enabled = false;
                alt.classList.remove('alt-display-state');
           
            }
        ); 

        element.addEventListener("mouseover", (event) => {
            
            alt_enabled = true;
            setTimeout(function(){
                if(!alt_enabled) return;
                alt.classList.add('alt-display-state');
            }, 500);
        });

        element.addEventListener("mouseout", (event) => { 
        
            alt_enabled = false;  
            alt.classList.remove('alt-display-state');
        });
             
    }

    add_hotKey(key1, key2, f){

        const keysPressed = {};

        document.addEventListener('keydown', (event) => {
            
            let key = event.key.toLowerCase();
            
            if (!event.repeat){ 
                keysPressed[key] = true;
                // console.log(`${key}`);
            }
            
            
            switch (true) {  
                case key === key1 && keysPressed[key2]:
                case key === key2 && keysPressed[key1]:
                // console.log('Z and X pressed!');
                f();
                break;
                default:
                break;
            }
        });

        document.addEventListener('keyup', (event) => {
            let key = event.key.toLowerCase();
            if (!event.repeat)
                delete keysPressed[key];
        });
    }


    insert(){
 
        var kfcard = document.createElement("div");
        kfcard.classList.add('card');        
        kfcard.id = Date.now().toString(36);

        let p = this.qt3.vir.getEndEffectorPosition();
        let rot = this.qt3.vir.getEndEffectorEuler();

        let ja = [0]; 
        for(let j=1;j<=7;j++) { 
            ja.push(this.qt3.vir.getAngle(j));
        }
         
        this.kfcardInfo[kfcard.id] = { 
            'Joint Angles [deg]': `${ja[1].toFixed(2)}, ${ja[2].toFixed(2)}, ${ja[3].toFixed(2)}, ${ja[4].toFixed(2)}, ${ja[5].toFixed(2)}, ${ja[6].toFixed(2)}, ${ja[7].toFixed(2)}`,
            'End-Effector Position [mm]': `x: ${p.x.toFixed(1)},  y: ${p.y.toFixed(1)},  z: ${p.z.toFixed(1)}`,
            'End-Effector Euler Angle (XYZ) [rad]': `x: ${rot._x.toFixed(1)},  y: ${rot._y.toFixed(1)},  z: ${rot._z.toFixed(1)}`
        };

        this.kfcardMeta[kfcard.id] = {ja: [...ja], frameId: null};
         
        this.kfcardMeta[kfcard.id].pos = this.qt3.vir.getEndEffectorPosition(); 
        this.kfcardMeta[kfcard.id].rot = this.qt3.vir.getEndEffectorEuler();


        if(this.selectedCard) {
            this.kfcardMeta[kfcard.id].frameId = this.kfcardMeta[this.selectedCard.id].frameId + 1;
      
            var cards = this.scrollBox.children;
            let idx = this.kfcardMeta[kfcard.id].frameId - 1;
            for(let i=idx; i<this.nCard;i++){ 
                this.kfcardMeta[cards[i].id].frameId += 1;
                this.update_label(cards[i]);           
            }            
        }
        else
            this.kfcardMeta[kfcard.id].frameId = this.nCard + 1;
            

        this.infoTabs.displayProperties(kfcard.id);
  
            if(this.nCard == 0 || !this.selectedCard) { 
                this.scrollSpacer.before(kfcard);
            }
            else this.selectedCard.after(kfcard); 
    
            let scope = this;
            this.add_snapShot(kfcard, function(_kfcard){
                scope.add_label(_kfcard);
                scope.add_dadApplyFrameLogic(_kfcard);

                scope.trajetoryHelper.plot();
            }); 
 
        this.add_autoScrollLogic(); 
        this.add_cardSelectLogic(kfcard); 
       

       

        this.nCard += 1;        
    }

 

    add_snapShot(kfcard, cb){  
    
        let width = window.getComputedStyle(kfcard).getPropertyValue('width');
 
        width = parseInt(width.split('px')[0]); 
     
        let scope = this;
         

        let p0 = new Vector3();
        let q0 = new Quaternion();
        p0.copy(scope.qt3.scene.userData.camera.position);
        q0.copy(scope.qt3.scene.userData.camera.quaternion);
   
        this.qt3.scene.userData.camera.position.set(760, 600, -760);
        this.qt3.scene.userData.camera.quaternion.set(-0.10, 0.89, 0.23, 0.37);
 
        scope.qt3.render();
 
        var imgurl = scope.qt3.renderer.domElement.toDataURL("image/jpeg");
  
        scope.qt3.scene.userData.camera.quaternion.copy(q0);
        scope.qt3.scene.userData.camera.position.copy(p0); 
        
         scope.qt3.render();

        const getMeta = (url, cb) => {
            const img = new Image();
            img.onload = () => cb(null, img);
            img.onerror = (err) => cb(err);
            img.src = url;
            };
            
        getMeta(imgurl, (err, img) => {

            var w_s = img.naturalHeight*0.43;
            var h_s = w_s;         
            var x_s = img.naturalWidth/2 - w_s*0.5;
            var y_s = img.naturalHeight/2 - w_s*0.72;

            var x_d = 0;
            var y_d = 0;
            var w_d = 150;
            var h_d = 150;  
 
            
            var canvas = document.createElement("canvas");      
            var ctx = canvas.getContext("2d");             
            ctx.drawImage(img, 
                x_s, y_s, w_s, h_s,
                x_d, y_d, w_d, h_d);

            var dataurl = canvas.toDataURL("image/jpeg");
        
       
            var imgContainer = document.createElement("div"); 
            imgContainer.classList.add('img-container');
            imgContainer.innerHTML += '<img src="'+dataurl+'"/>';   
            kfcard.appendChild(imgContainer);
 
            cb(kfcard);
        }); 

    }    

    add_label(kfcard){

        var label = document.createElement("div");
        label.classList.add('card-label');

        
        kfcard.insertBefore(label, kfcard.firstChild);
 
        let frameId = this.kfcardMeta[kfcard.id].frameId;
         
        label.innerHTML = `FRAME&nbsp;&nbsp;<strong>${frameId}</strong>`;
 
    }


    add_autoScrollLogic(){

        let scope = this;

        let oldScrollMax = this.scrollBox.scrollWidth - this.scrollBox.clientWidth-this.cardScrollWidth-1;
 
        let autoScroll = (Math.abs(this.scrollBox.scrollLeft - oldScrollMax) < 5) || (this.tween.running(0));
 
        
        if(autoScroll){
           
            let start = oldScrollMax;
            let end = this.scrollBox.scrollWidth - this.scrollBox.clientWidth - 1;
            this.tween.newSchedule(0, start, end, 10, SchedMode.LINEAR);
            this.tween.start(0, 5, function(next){
                 
                scope.scrollBox.scrollLeft = parseInt(next);
                
            });
        }
    }

 
 
    add_cardSelectLogic(kfcard){ 
        
        let scope = this;

        kfcard.addEventListener('pointerdown', function() { 
            

            scope.selectCard(kfcard);
            
        });
        
    }

    selectCard(kfcard){
            
        if(this.selectedCard){
            if(kfcard.id == this.selectedCard.id){
                this.selectedCard = null;
                this.deHighLight(kfcard);
                
            }
            else{ 
                this.deHighLight(this.selectedCard);
                
                this.selectedCard = kfcard; 
                this.highLight(this.selectedCard); 

                this.infoTabs.displayProperties(kfcard.id);
            }
        }
        else{
            this.selectedCard = kfcard; 
            this.highLight(this.selectedCard); 

            this.infoTabs.displayProperties(kfcard.id);   
        } 
    }




    copyCard(kfcard){

        var _kfcard = document.createElement("div"); 
 
        _kfcard.classList.add('card'); 
        _kfcard.innerHTML = kfcard.innerHTML;
        
        return _kfcard; 
    }


    add_dadApplyFrameLogic(kfcard){
 
        let scope = this;  

        kfcard.addEventListener('mousedown', e => {
 
            let _kfcard = scope.copyCard(kfcard); 

            _kfcard.querySelector('img').style.opacity = 0.3;
            _kfcard.style.border = "var(--w_bdr_card) solid rgba(127, 255, 255, 0.3)";
            _kfcard.style.boxShadow = "0 0 5px rgba(0,255,255,0.3)";
            _kfcard.querySelector('.card-label').style.background = "rgba(127, 255, 255, 0.3)";
            
            scope.kfEditor.appendChild(_kfcard);
             
            let marginTop = window.getComputedStyle(kfcard).getPropertyValue('margin-top');
            marginTop = parseInt(marginTop.split('px')[0]);

            let marginLeft = window.getComputedStyle(kfcard).getPropertyValue('margin-left');
            marginLeft = parseInt(marginLeft.split('px')[0]);

            let kfEditorRect = scope.kfEditor.getBoundingClientRect();
            let kfcardRect = kfcard.getBoundingClientRect(); 

            _kfcard.style.position = 'absolute';
            _kfcard.style.left = `${kfcardRect.left - kfEditorRect.left-marginLeft}px`;
            _kfcard.style.top = `${kfcardRect.top - kfEditorRect.top-marginTop}px`;
            _kfcard.style.zIndex=25;

            let offsetX;
            let offsetY;
    
            const dragOffset = {};
     
            document.body.style['userSelect'] = 'none';
 
            offsetX = e.pageX || e.clientX + window.scrollX;
            offsetY = e.pageY || e.clientY + window.scrollY;

            dragOffset.x = offsetX - _kfcard.offsetLeft;
            dragOffset.y = offsetY - _kfcard.offsetTop;


            let canApply = false;

            function onMouseMove(e){ 

                let elements = document.elementsFromPoint(e.pageX, e.pageY);
                
                canApply = true;
                elements.forEach((elt, i) => {
                    if(elt === scope.kfEditor) canApply = false;
                  });
                if(canApply) _kfcard.style.cursor = "copy";
                else _kfcard.style.cursor = "pointer";

                const height = parseInt(getComputedStyle(_kfcard).height);
                const width = parseInt(getComputedStyle(_kfcard).width);
                
                // const gap = constraintGap ?? -18;
                const gapLR =  0;
                const gapTB = -1000;
     
                offsetX = e.pageX || e.clientX + document.documentElement.scrollLeft;
                offsetY = e.pageY || e.clientY + document.documentElement.scrollTop;
    
                // Left and right constraint
                if (e.pageX - dragOffset.x < gapLR) {
                    offsetX = gapLR;
                } else if (e.pageX - dragOffset.x + width > document.body.clientWidth - gapLR) {
                    offsetX = document.body.clientWidth - width - gapLR;
                } else {
                    offsetX = e.pageX - dragOffset.x;
                } 
    
                // Top and bottom constraint   
                if (e.pageY - dragOffset.y < gapTB) {
                    offsetY = gapTB;
                } else if (e.pageY - dragOffset.y + height > window.innerHeight - gapTB) {
                    offsetY = window.innerHeight - height - gapTB;
                } else {
                    offsetY = e.pageY - dragOffset.y;
                }

                Object.assign(_kfcard.style, {
                    top: `${offsetY}px`,
                    left: `${offsetX}px`
                });
            }

            function onMouseUp(e){ 
 
                if(canApply){

                    let ja = scope.kfcardMeta[kfcard.id].ja;

            

                    let sched = {
                        mode: SchedMode.EXPONENTIAL_INOUT,
                        n: 20,
                        T: 600
                    };
                    scope.qt3.setAnglesTimeAligned("", ja, sched);
                }
 

                document.body.style['userSelect'] = 'auto';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                _kfcard.remove();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });  
    }


    update_label(kfcard){
        let label = kfcard.querySelector(".card-label");
        let frameId = this.kfcardMeta[kfcard.id].frameId;
        label.innerHTML = `FRAME&nbsp;&nbsp;<strong>${frameId}</strong>`;
    }


    highLight(kfcard){
        if(!kfcard) return;

        kfcard.style.borderColor = "rgba(127, 255, 255, 1)"; 
        kfcard.style.boxShadow = "0 0 5px rgba(0,255,255,1)"; 
    }

    deHighLight(kfcard){
        // console.log(`kfcard.id: ${kfcard.id}`);
        if(!kfcard) return;
        kfcard.style.borderColor = "rgba(127, 255, 255, 0.5)"; 
        kfcard.style.boxShadow = "0 0 5px rgba(0,255,255, 0.5)"; 
    }

    setSelectedCard(kfcard){

        if(this.selectedCard){ 
            this.deHighLight(this.selectedCard);
        }

        this.selectedCard = kfcard; 
        this.highLight(this.selectedCard);
        
    }

    remove(){

        if(!this.selectedCard) return;
         
        let old = this.selectedCard;

   
        var cards = this.scrollBox.children;
        let idx_old = this.kfcardMeta[old.id].frameId - 1;
        let idx_next = idx_old + 1;
        for(let i=idx_next; i<this.nCard;i++){
            // cards[i].frameId -= 1;
            this.kfcardMeta[cards[i].id].frameId -= 1;
            this.update_label(cards[i]);
            // next = next.nextSibling;             
        }
 
        if(idx_next < this.nCard){
            this.selectedCard = cards[idx_next];
            this.highLight(this.selectedCard);
        }
        else{
            this.selectedCard = null;
        }

        delete this.kfcardMeta[old.id];
        this.nCard -= 1;
 
        this.scrollBox.removeChild(old); 

        
    }
 
   


    play(){
          
        let scope = this;  

        const checkDone = () =>  {
            
            let done = true; 

            if(scope.qt3.getUserMode() == UserMode.VIR2PHY){

                for(let j=1;j<=6;j++){
                    let prog = scope.qt3.phy.progress(j); 

                    console.log(`j${j} prog: ${prog}`);

                    if(prog >= 0.5) continue;
                    done = false;       
                    break; 
                     
                } 
            }
            else if(scope.qt3.getUserMode() == UserMode.VIR){
 
                for(let j=1;j<=6;j++){
                    if(scope.qt3.vir.done(j)) continue;
                    done = false;       
                    break; 
                }                 
            }

           
            if(!done){ 
                setTimeout(function(){
                    checkDone();
                }, 50);
            }
            else{
 
                _play_oneStep();
                  
            }
        }

 
        let ja_prev = null;
        const _play_oneStep = () =>  {
             

            let _sched = scope.trajetoryHelper.next();
            if(!_sched) return;

        
            let sched = {
                 
                mode: SchedMode.LINEAR,
                n: 10,
                T: 100
            };
 
            scope.qt3.setAnglesTimeAligned("", _sched.ja, sched, true, ja_prev); 
            ja_prev = [..._sched.ja];
           
            
            _play_oneStep();
 
        }
        
          
        this.trajetoryHelper.newSchedule();
        let ja_all = [];
        let _sched = this.trajetoryHelper.next();
        while(_sched){ 
            ja_all.push(_sched.ja);  
            _sched = this.trajetoryHelper.next();
        }
 
        scope.qt3.setAnglesTimeAlignedFIFO("", ja_all); 
    }
  

    

    


    
    getAllCardPositions(){

        var cards = this.scrollBox.children; 

        let positions = []; 

        for(let i = 0; i < this.nCard; i++){
            
            let card = cards[i]; 

            let pos = this.kfcardMeta[card.id].pos; 
            positions.push(pos); 
        }

        return positions;
    }


    getAllCardRotations(){

        var cards = this.scrollBox.children; 
 
        let rotations = [];

        for(let i = 0; i < this.nCard; i++){
            
            let card = cards[i]; 
 
            let rot = this.kfcardMeta[card.id].rot; 
            rotations.push(rot);                
        }

        return rotations;
    }



}



class TrajectoryHelper {
 
    constructor(kfEditor, qt3) {

        
        this.trajetory = new Object3D(); 
        this.qt3 = qt3;
        this.kfEditor = kfEditor;
        
        this.qt3.scene.add(this.trajetory);
        

        let scope = this;
        this.n = 20;
 

        let btn_up = document.createElement('button'); 
        btn_up.id = `btn-display-trajectory-up`;
        btn_up.innerHTML = `↑`;

        let btn_down = document.createElement('button'); 
        btn_down.id = `btn-display-trajectory-down`;
        btn_down.innerHTML = `↓`;


        btn_up.addEventListener('click', function(){

            scope.n += 1;
            scope.plot();
        }); 

        btn_down.addEventListener('click', function(){

            if(scope.n > 0){
                scope.n -= 1; 
                scope.plot();
            }

        }); 

 
        let toolbar = this.kfEditor.kfEditor.querySelector('.toolbar');
       
        toolbar.appendChild(btn_up);
        toolbar.appendChild(btn_down);
          

    } 


    
    plot(){ 

        if(this.kfEditor.nCard < 2) return;

        this.clear_trajectory();
        this.generate_spline();

        this.plot_frame();

        this.plot_trajectory(); 
    }


    clear_trajectory(){

        this.trajetory.traverse(

            function(obj){

                if(obj.geometry){
                    obj.geometry.dispose();
                }

                if(obj.material)
                    obj.material.dispose();
            }
        );  

        this.qt3.scene.remove(this.trajetory);
        this.trajetory = new Object3D();
        this.qt3.scene.add(this.trajetory);  
    }



    generate_spline(){
 
        let positions = this.kfEditor.getAllCardPositions();
        let rotations = this.kfEditor.getAllCardRotations();
        for(let i = 0; i < rotations.length; i+=1){
            let _rot = rotations[i];
            rotations[i] = new Vector3(_rot._x, _rot._y, _rot._z);
        }
        
        this.posSpline = new CatmullRomCurve3( positions ); 
        this.posSpline.curveType = 'catmullrom';
        this.posSpline.closed = false;  

        this.rotSpline = new CatmullRomCurve3( rotations ); 
        this.rotSpline.curveType = 'catmullrom';
        this.rotSpline.closed = false;  
    }

    
    plot_frame(){

        let n_hasSol = 0;

        // let dt = 1/this.n;
        for(let i = 0; i <= this.n; i++){

            let t = i/this.n;

            let pos = this.posSpline.getPoint(t);
            let _rot = this.rotSpline.getPoint(t);
            let rot = new Euler(_rot.x, _rot.y, _rot.z);
              
            let matrixWorld = new Matrix4(); 
            matrixWorld.makeRotationFromEuler(rot);
            matrixWorld.setPosition(pos); 
                       
 

            let L = 20;
            let R = 1.5;

            let gizmoMaterial = new MeshBasicMaterial( { 
                fog: false, 
            } );
            const matRed = gizmoMaterial.clone();
            matRed.color.setHex( 0xbb0000 );
	
            const matGreen = gizmoMaterial.clone();
            matGreen.color.setHex( 0x00bb00 );

            const matBlue = gizmoMaterial.clone();
            matBlue.color.setHex( 0x0000bb );



            const lineGeometry = new CylinderGeometry(R, R, L, 6);
            lineGeometry.translate( 0, L/2, 0 );

            let obj = new Mesh( lineGeometry, matRed ); 
            obj.rotation.set( 0, 0, - Math.PI / 2  );	            
            obj.applyMatrix4(matrixWorld);            
            this.trajetory.add(obj); 
 
            obj = new Mesh( lineGeometry, matGreen ); 
            obj.applyMatrix4(matrixWorld); 
            this.trajetory.add(obj); 


            obj = new Mesh( lineGeometry, matBlue ); 
            obj.rotation.set( Math.PI / 2, 0, 0  );	
            obj.applyMatrix4(matrixWorld);  
            this.trajetory.add(obj);      
            
            

            gizmoMaterial = new MeshBasicMaterial( {
                transparent: true
            } ); 
            gizmoMaterial.color.setHex( 0xffffff );
            gizmoMaterial.opacity = 0.8;
            const ball = new Mesh(new SphereGeometry(3), gizmoMaterial); 
            ball.position.copy(pos);  
            this.trajetory.add(ball);
    
                        
        } 

 
    }


    plot_trajectory(){
        
        let extrusionSegments = 5*this.n;
        let radiusSegments = 5;
        let closed = false;
        let tubeRadius = 1; 
        

        let tubeGeometry = new TubeGeometry( this.posSpline, extrusionSegments, tubeRadius, radiusSegments, closed );

        const material = new MeshLambertMaterial( { color: 0x55ffff } );

        const wireframeMaterial = new MeshBasicMaterial( { color: 0x000000, opacity: 0.3, wireframe: true, transparent: true } ); 

        let mesh = new Mesh( tubeGeometry, material );
        const wireframe = new Mesh( tubeGeometry, wireframeMaterial );
        mesh.add( wireframe );

        this.trajetory.add( mesh);
    }



    get_n(){
        return this.n;
    }

    // in ms.
    getSamplingPeriod(){
        return this.T * 2.7; // T in units of 2.7ms
    }

    newSchedule(){
        
        this._next = 0;
        this.sched = {};
 
        let ja_prev = null, i_prev; 
        let max_vT = -1;

        let solCnt = 0;
        for(let i = 0; i <= this.n; i++){

            let t = i/this.n;

            let pos = this.posSpline.getPoint(t);
            let _rot = this.rotSpline.getPoint(t);
            let rot = new Euler(_rot.x, _rot.y, _rot.z);
              
            let matrixWorld = new Matrix4(); 
            matrixWorld.makeRotationFromEuler(rot);
            matrixWorld.setPosition(pos);  

    
            let q = new Quaternion();
            q.setFromRotationMatrix(matrixWorld);
    
            this.qt3.ctrls.transform.probeBall.position.copy(pos);
            this.qt3.ctrls.transform.probeBall.quaternion.copy(q);          
            let ja = this.qt3.ctrls.transform.solve_IK(null, false);  

            if(ja){

                solCnt+=1;

                this.sched[i] = {};
                this.sched[i].ja = ja;
                
                

                if(ja_prev){

                    this.sched[i].di = i - i_prev; 
                    this.sched[i].v = {};
                    
                    for(let j=1;j<7;j++){
                         
                        let vT = Math.abs(ja_prev[j] - ja[j]) / (i - i_prev);
                        
                        this.sched[i].v[j] = vT;

                        if(vT > max_vT) max_vT = vT;
                    }
                }
             

                ja_prev = ja;
                i_prev = i;
            }
        }

        
        console.log(`sol percentage: ${solCnt / (this.n+1) * 100} %`);


        // units of this.T is '2.7ms'.
        this.T = max_vT / this.qt3.getMaxSpeed(); // deg / (rev / sec) == sec/360 == 2.7ms
         
        for (let [i, tb] of Object.entries(this.sched)) {

            if('v' in tb){
                for(let j=1;j<7;j++) tb.v[j] = Math.max(tb.v[j] / this.T, 0.5);
            }
            else{ // the first one that has ik solution.
                tb.v = {};
                for(let j=1;j<7;j++) tb.v[j] = 1.5;
            } 
        }
            
    }


    next(){

        let keys = Object.keys(this.sched);

        if(this._next >= keys.length) return null;

        let i = this._next;
        this._next += 1;
          
        return this.sched[keys[i]]; 
    }



}


 


class InfoTabs {

    constructor(kfEditor, kfEditorDom) {
        

        this.kfEditor = kfEditor;
        this.kfEditorDom = kfEditorDom;
        

        this.container = document.createElement('div');
        this.container.classList.add('tab-container');        
        kfEditorDom.appendChild(this.container); 
        this.container.style.width = `${window.innerWidth*0.4}px`; 
        // container.innerHTML = `<div class="grid"> </div>`;

        this.dom = new TabHelper(this.container);


        this.dom.create_page("Properties");
        this.dom.create_page("Files");
        this.dom.setActive("Properties");
 
        this.propertyTable = new ResizableTable(this.dom.get_page("Properties"), "Properties"); 
         
    }

    onWindowResize(){

        this.container.style.width = `${window.innerWidth*0.4}px`; 

        this.dom.onWindowResize();
 
    }

    displayProperties(id){

        this.propertyTable.clear_table();
 
        let kfcardMeta = this.kfEditor.kfcardMeta[id];
        let kfcardInfo = this.kfEditor.kfcardInfo[id];

        this.propertyTable.add_record({Name: 'Frame ID', Value: kfcardMeta.frameId});

        for (const [name, value] of Object.entries(kfcardInfo)){
            this.propertyTable.add_record({Name: name, Value: value});
        }

        
    }


    

} 

   












export { KeyFrameEditor };



