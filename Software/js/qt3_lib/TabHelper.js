

class TabHelper{

    constructor(container) {
        
        this.container = container;
        container.innerHTML += `<div class="tab"><div class="tablinks"></div></div>`;


        this.dom = document.querySelector(`.tab`);

        // same as 100%.
        let height = window.getComputedStyle(container).getPropertyValue('height');         
        height = parseInt(height.split('px')[0]);
        this.dom.style.setProperty('--h', `${height}px`);

        // this.tablinks = this.dom.querySelector(`.tablinks`);        
        this.tabs = {};
   
    } 

 
    onWindowResize(){

        let height = window.getComputedStyle(this.container).getPropertyValue('height'); 
        
        height = parseInt(height.split('px')[0]);
        this.dom.style.setProperty('--h', `${height}px`);
    }



    get_page(name){
        return this.tabs[name].content;
    }
    

    create_page(name) {

        let scope = this;
        let tablinks = this.dom.querySelector(`.tablinks`);

        this.tabs[name] = {};
 

        let tablink = document.createElement('button');
        tablink.classList.add('tablink');
        tablink.innerHTML = name;
        
        tablink.onclick = function(){
            scope.setActive(name); 
        }
  
        tablinks.appendChild(tablink); 
        this.tabs[name].link = tablink;
 
        let page = document.createElement('div');
        page.classList.add('tabcontent');
        this.dom.appendChild(page); 
 
        // page.innerHTML = content; 
        // page.appendChild(childDom);
        this.tabs[name].content = page; 

        return page;
    }


    
         
    setActive(name) {
        
      
        var i, tabcontent, tablinks;
        tabcontent = this.dom.getElementsByClassName("tabcontent");            
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        tablinks = this.dom.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // document.getElementById(name).style.display = "block";
        // pages[name].style.display = "block";

        this.tabs[name].link.className += " active";
        this.tabs[name].content.style.display = "block";

         
    }

}

export { TabHelper };


