
const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;
 
import { Tween, SchedMode } from './Tween.js';


const ctrlName = 'slider';

class SliderCtrl {

    constructor(qt3, DOMselector, cfgs) {

         

        let dashboard = document.querySelector('.dashboard');   

        let h = window.innerHeight*0.78;
        // let h = 1200;

        // this.window.setHeight(h);
     
        this.DOMselector = DOMselector;
        this.groupContainer = document.querySelector(this.DOMselector);   
        
        this.qt3 = qt3;
 

        let dx = 50; 
        let dy = 50; 

        let sx = 120;
        let sy = 120;
        
        let pos = [{'left': `${sx*0+dx}px`,  'top': `${dy}px`},
                   {'left': `${sx*1+dx}px`,  'top': `${dy}px`},
                   {'left': `${sx*2+dx}px`,  'top': `${dy}px`},
                   {'left': `${sx*3+dx}px`,  'top': `${dy}px`}, 
                   {'left': `${sx*0+dx}px`,  'top': `${sy*1 + dy}px`},
                   {'left': `${sx*1+dx}px`,  'top': `${sy*1 + dy}px`},
                   {'left': `${sx*2+dx}px`,  'top': `${sy*1 + dy}px`}];
                   
                   
     


        this.sliders = [];                  

        for(let i = 0; i < pos.length; i++){

             this.sliders.push(new Slider(i, qt3, this.window, DOMselector, cfgs[i]));

             this.sliders[i].setPos(pos[i]);


            this.sliders[i].setD(100);
 
             dashboard.appendChild(this.sliders[i].getDom());
 
        }  
    }



    onWindowResize(){

        this.window.setHeight(window.innerHeight*0.8);

         
    }
    
    

    setPos(pos){
        this.window.setPos(pos);
    }

    syncUpdate(j, a, callerName){
    
        let angle = parseFloat(a);
 
        this.sliders[j-1].setAngle(angle);
    }

 
    getAngle(j){
        return this.sliders[j-1].getAngle();
    }

 
 
}









 

class Slider {
 
    constructor(id, qt3, window, DOMselector, cfg) {
        
        this.id = id;
        this.qt3 = qt3;

        this.DOMselector = DOMselector;
        
        this.groupContainer = document.querySelector(this.DOMselector);  // Slider container

        

        this.window = window;

        this.slider = document.createElement('div');
        this.slider.classList.add('slider');
        
      
        this.cfg = cfg;                  
  
        this.intervalId = null;

        this.tween = new Tween();

        this.draw();  
    }

    
   
    draw() {

        this.slider.style.setProperty('--d', '200px');

        this.rating = document.createElement('div');
        this.rating.classList.add('rating');

        this.slider.appendChild(this.rating);

        this.cnt_subtile = 0;
        this.cnt_suptile = 0;

        this.n_tile = 72;
        this.a_tile = 360 / this.n_tile;
        this.a_step = 1;
        this.steps_per_tile = this.a_tile / this.a_step; 

       
        this.angle = 0;        
        
    
        for(var i = 0; i < this.n_tile; i++){ 
            this.rating.innerHTML += "<div class='block'></div>";
            const block = this.slider.getElementsByClassName('block');
            block[i].style.transform = "rotate("+this.a_tile*i+"deg)";
            block[i].style.background = "rgba(255,255,255,0)";   
        } 

  
        this.rating.innerHTML += `<div class="counter"> </div>`;
        this.rating.innerHTML += `<div class="name">${this.cfg.displayName} </div>`; 
        this.rating.innerHTML += `<div class="handleContainer"><div class="handle"></div></div>`;

        this.nameDom = this.rating.querySelector(`.name`);
        
        this.addRatingCtrl();
        this.addCounterInputField();
 

        this.counter = this.rating.querySelector('.counter'); 

        this.handleContainer = this.slider.getElementsByClassName('handleContainer')[0];
   
    }

    setOpacity(alpha){
        this.rating.style.backgroundColor = `rgba(4, 34, 61, ${alpha})`;
    }

    setDisplayName(name){
        this.nameDom.innerHTML = name;
    }

    setMin(m){
        this.cfg.min = m;
    }

    setMax(m){
        this.cfg.max = m;
    }

    setJoint(j){
        this.id = j-1;
    }

    addLimitBlock(a){

        let blk;

        blk = document.createElement('div');
        blk.classList.add('block'); 
        this.rating.appendChild(blk);

        blk.style.transform = "rotate("+a+"deg)";
        blk.style.background = "rgba(255,255,255,1)";   

        blk.style.top = '-5px';
        blk.style.transformOrigin = '0px calc(var(--d)/2 + 5px)';

        

        blk.style.width = '1px';
        blk.style.height = '5px';
    }

 
 
    addCounterInputField(){
        
        let scope = this;
  
        function init_input(){
            let input = document.createElement('input');
            input.type = "text";
            input.value = "";
            scope.rating.appendChild(input);
            input.addEventListener('mousedown', onPointerDown, false);
            return input;
        }

        let input = init_input();

        let oldHTML;
        
        function onPointerDown(evnet){ 

            evnet.stopPropagation();

            if(!oldHTML){

                oldHTML = scope.counter.innerHTML; 
                input.value = oldHTML;
                scope.counter.innerHTML = "";
                

                function close(evnet){  

                    let text = input.value; 
                    
                    let a = scope.clampByLimits(parseFloat(text));
                    
                    if(text == "" || isNaN(a)) scope.counter.innerHTML = oldHTML;    
                    else scope.qt3.setAngle(ctrlName, scope.id+1, a, null);

                    oldHTML = null; 

                    document.removeEventListener( 'mousedown', close );

                    scope.rating.removeChild(input); 
 
                    input = init_input();                    
                }

                function onKeyDown(event){
 
                    let key = event.key.toLowerCase(); 
            
                    if(key == 'enter'){ 
                        close();
                    }          
                    else if(key == 'arrowdown' || key == 'arrowleft'){  
                        
                        let da = 0.01;
                        if (event.repeat) da = 1;
                        
                        let a = scope.clampByLimits(parseFloat(input.value)-da);
                        input.value = `${a.toFixed(2)}`;

                        scope.qt3.setAngle(ctrlName, scope.id+1, a, null);
                        scope.counter.innerHTML = "";
                             
                    }  
                    else if(key == 'arrowup' || key == 'arrowright'){ 
                               
                        let da = 0.01;
                        if (event.repeat) da = 1;
                        
                        let a = scope.clampByLimits(parseFloat(input.value)+da);
                        input.value = `${a.toFixed(2)}`;

                        scope.qt3.setAngle(ctrlName, scope.id+1, a, null);
                        scope.counter.innerHTML = "";
                    }                   
                }


                input.addEventListener('keydown', onKeyDown );

                document.addEventListener("mousedown", close); 
            }
        }
    }
 

    addRatingCtrl(){
 

        let mouseDown = false; 
        let scope = this;


        function calculateAngle(rmc){
        
            let r = window.getComputedStyle(scope.slider).getPropertyValue('width');
            r = parseInt(r.split('px')[0]);
        
            const cx = r/2;
            const cy = r/2;
    
            let angle = Math.atan2(rmc.y - cy, rmc.x - cx) * RAD2DEG + 90;
            
            if(angle > 180){
                angle = -360 + angle;
            }
      
            return  scope.clampByLimits(angle);
        }
     
    
        function onPointerDown(e) {
    
            
            if (mouseDown) return;
     
            mouseDown = true; 
            const rmc = getRelativeMouseOrTouchCoordinates(e);
     
            let a = calculateAngle(rmc);
      
            
            let sched = {
                mode: SchedMode.EXPONENTIAL_INOUT,
                n: 20,
                T: 600
            };
            // scope.qt3.vir.setAngle(ctrlName, scope.id+1, a, sched);            
            scope.qt3.setAngle(ctrlName, scope.id+1, a, sched);
        }
    
    
        function onPointerMove(e) {

            // console.log(`onPointerMove`);
    
            scope.slider.style.cursor = "pointer";
             
            if (!mouseDown) return;
            e.preventDefault();
            const rmc = getRelativeMouseOrTouchCoordinates(e);
      
            let a = calculateAngle(rmc);
 
            
            scope.qt3.stop(scope.id+1);
            scope.qt3.setAngle(ctrlName, scope.id+1, a, null);               
        }
    
     
        function onPointerUp() {
            if (!mouseDown) return;
            mouseDown = false; 
        }
    
      
        function getRelativeMouseOrTouchCoordinates(e){
                
            const containerRect = scope.slider.getBoundingClientRect();
    
            let x, 
                y, 
                clientPosX, 
                clientPosY; 
    
            clientPosX = e.clientX;
            clientPosY = e.clientY; 
    
            // Get Relative Position
            x = clientPosX - containerRect.left;
            y = clientPosY - containerRect.top;
    
         
            return { x, y };
        }         

        this.slider.addEventListener('mousedown', onPointerDown, false);
        this.slider.addEventListener('mousemove', onPointerMove, false);
        this.slider.addEventListener('mouseup', onPointerUp, false); 
    }





    setD(d){
        this.slider.style.setProperty('--d', `${d}px`);        
    }

    setPos(pos){

        if('left' in pos){this.slider.style.left = `${pos['left']}`};
        if('right' in pos){this.slider.style.right = `${pos['right']}`};
        if('top' in pos){this.slider.style.top = `${pos['top']}`};
    }
    
    getDom(){
        return this.slider;
    }

    getAngle(){
        return this.angle;
    }
 

    clampByLimits(angle){
        if(angle > this.cfg.max)
            return this.cfg.max;
        else if(angle < this.cfg.min)
            return this.cfg.min;  
        else
            return angle;  
    }
   

    syncUpdate(j, a, callerName){
        
        if(j != this.id+1)return;

        let angle = parseFloat(a);

        // this.sliders[j-1].syncUpdate(angle);
        this.setAngle(angle);
    }



    clear_block(block){
        // const block = this.slider.getElementsByClassName('block')[sup + dir];
        block.style.background = "rgba(255,255,255,0)";
        block.style.boxShadow = "0 0 15px rgba(0,255,255,0), 0 0 30px rgba(0,255,255,0)";        
    }

    clear_all_block(){
        let n = this.n_tile;
        for(let i = 1; i <= n/2; i++){ // n need be even.
            
            let block = this.get_block(i);
            this.clear_block(block);
            
            block = this.get_block(-i);
            this.clear_block(block);            
        }
    }

    fill_block(block, dir, prcn){
        
        // let dirMap = {1: 'right', -1: 'left'};

        let gDir = (dir > 0) ? 'right' : 'left';

        block.style.background = "rgba(0,0,0,0)"; 
        block.style.backgroundImage = `linear-gradient(to ${gDir}, rgba(255,255,255,1) ${prcn}%, rgba(0,0,0,0) ${prcn}%)`;   
        block.style.boxShadow = "0 0 15px rgba(0,255,255,1), 0 0 30px rgba(0,255,255,1)"; 
    }

    get_block(i){

        let n = this.n_tile;
        let block;
        
        if(i>0){
            block = this.slider.getElementsByClassName('block')[i - 1];        
        }
        else{
            block = this.slider.getElementsByClassName('block')[n + i];        
        }
        
        return block;
    }
 

    setAngle(angle){ // deg, 
 
        // this.counter.innerText = parseInt(angle);
        this.counter.innerHTML = `${angle.toFixed(2)} °`;
        this.handleContainer.style.transform = "rotate(" + (angle) + "deg)";

        this.clear_all_block();

        let dir = Math.sign(angle);

        let nf = Math.abs(angle) / this.a_tile;

        let n = parseInt(nf);
        let f = nf - n;
        

        for(let i = 1; i <= n; i++){
            let block = this.get_block(dir * i);
            this.fill_block(block, dir, 100);
        }

        if(f > 0.01){
            let block = this.get_block(dir * (n+1));
            this.fill_block(block, dir, 100*f);
        }

        
        this.angle = angle; 
    }
   
 
   
}


  





export { SliderCtrl, Slider };