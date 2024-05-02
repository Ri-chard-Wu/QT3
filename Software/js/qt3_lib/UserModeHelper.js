 
import { 
	Vector3,
    Quaternion 
} from 'three';
 
import { Tween, SchedMode } from './Tween.js';
import { UserMode } from './QT3.js';

class UserModeHelper {
 
    constructor(qt3, defaultIdx = 2, cb) {


        this.tween = new Tween();

        this.qt3 = qt3;

        function onChange(oldMode, newMode){
            // console.log(`oldMode: ${oldMode}, newMode: ${newMode}`);
            if(oldMode == UserMode.CALIBRATE){
                scope.qt3.phy.SaveCalibrateData();
            }
        }
        this.dashboard = document.querySelector('.dashboard');  

        let cfg = {pos:{left:4, top:4}, selName: 'USER MODE', 
                options: UserMode, defaultOption: 'VIR2PHY'};
     
        var scope = this; 
   
        this.window = document.createElement('div');
        this.window.classList.add('user-mode-container');
        this.dashboard.appendChild(this.window);
     
        this.modeData = {};

        let names = Object.keys(cfg.options);
        this.selectedName = names[defaultIdx];
        let selectedIdx = 0;
 
        names.forEach(
            (name, i) =>{
                let modeBtn = document.createElement('div');  
                modeBtn.classList.add('mode-button');  

                let modeBtnIcon = document.createElement('div');  
                modeBtnIcon.classList.add('mode-button-icon');  
            
                modeBtnIcon.innerHTML =`<img src=http://127.0.0.1:8080/images/${name}.png  width="80" height="60">`;
              
                modeBtn.appendChild(modeBtnIcon);
        
                let modeBtnTxt = document.createElement('div');  
                modeBtnTxt.classList.add('mode-button-text');   
                modeBtnTxt.innerHTML = name;
                modeBtn.appendChild(modeBtnTxt);

                this.window.appendChild(modeBtn);

                
                let scope = this;

                function onClick(e){ 

                    let width = window.getComputedStyle(modeBtn).getPropertyValue('width');         
                    width = parseInt(width.split('px')[0]);                    
 
                    
                    let start = selectedIdx * (width);
                    let end = i * (width );
 
                    scope.tween.newSchedule(0, start, end, 20, SchedMode.EXPONENTIAL_INOUT);
                    scope.tween.start(0, 10, function(next){
                         
                        highlightBox.style.left = `${next}px`;
                        
                    });
 
                    cb(UserMode[scope.selectedName], UserMode[name]);

                    selectedIdx = i;
                    scope.selectedName = name;

                    
                }
 
                modeBtn.addEventListener("mouseover", (event) => {
            
                    modeBtn.style.cursor = "pointer";
                }); 

                modeBtn.addEventListener('click', onClick);
                
                scope.modeData[name] = {};
                scope.modeData[name].select = function(){ 
                    modeBtn.click();
                }

                if(i == defaultIdx) modeBtn.click();
            }

        ); 

        let highlightBox = document.createElement('div');  
        highlightBox.classList.add('mode-button'); 
        highlightBox.classList.add('highlight-box');
        this.window.appendChild(highlightBox);

        highlightBox.addEventListener("mouseover", (event) => {
            
            highlightBox.style.cursor = "pointer";
        });        
  
    }


 

    getUserMode(){ 
        
        return UserMode[this.selectedName];
    }

    setUserMode(modeId){
        

        function swap(json){
            var ret = {};
            for(var key in json){
              ret[json[key]] = key;
            }
            return ret;
        }


        let id2name = swap(UserMode);

        this.modeData[id2name[modeId]].select();
    }
 
    setUserModeChangeCallBack(cb){
        this.sel_userMode.setChangeCallBack(cb);
    } 
}


 
  

export { UserModeHelper };



