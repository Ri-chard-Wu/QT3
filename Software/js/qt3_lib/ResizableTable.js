
class ResizableTable{

    constructor(container, tableName) {
    
        this.container = container;


        let spacer = document.createElement('div');
        spacer.classList.add('tableSpacer');
        this.container.appendChild(spacer);



        this.dom = document.createElement('div');
        this.dom.classList.add('resizable-table-container');
        this.container.appendChild(this.dom);
 
        
        this.h_container = window.getComputedStyle(container).getPropertyValue('height');   
        this.dom.style.setProperty('--h', this.h_container);

        // console.log(`this.h_container: ${this.h_container}`);

        this.dom.innerHTML = `
             
             <table id="${tableName}" class="resizable-table">

                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Value</th>
                    </tr>
                </thead>

                <tbody>
                                                            
                </tbody>

            </table>
        `;
    
            
        this.table = this.container.getElementsByTagName('tbody')[0];

        
        let scope = this;
        resizableGrid(this.container.querySelector('.resizable-table'));

     
        function resizableGrid(table) {

            var row = table.getElementsByTagName('tr')[0];
            var cols = row ? row.children : undefined;
            if (!cols) return;
            
            // table.style.overflow = 'hidden';
        
            var tableHeight = parseInt(scope.h_container.split('px')[0]);
    

            for (var i=0;i<cols.length;i++){

                

                var div = createDiv(tableHeight);
                cols[i].appendChild(div);
                // cols[i].style.position = 'relative';
                setListeners(div);
            }  



            function setListeners(div){

                
                var pageX,curCol,nxtCol,curColWidth,nxtColWidth;


                div.addEventListener('mousedown', function (e) {
                    curCol = e.target.parentElement;
                    nxtCol = curCol.nextElementSibling;
                    pageX = e.pageX; 
                    
                    var padding = paddingDiff(curCol);
                    
                    curColWidth = curCol.offsetWidth - padding;
                    if (nxtCol)
                        nxtColWidth = nxtCol.offsetWidth - padding;
                });


                div.addEventListener('mouseover', function (e) {
                    e.target.style.borderRight = '4px solid #ffffff';
                })


                div.addEventListener('mouseout', function (e) {
                    e.target.style.borderRight = '';
                })


                document.addEventListener('mousemove', function (e) {
                    if (curCol) {
                        var diffX = e.pageX - pageX;
                    
                        if (nxtCol)
                        nxtCol.style.width = (nxtColWidth - (diffX))+'px';

                        curCol.style.width = (curColWidth + diffX)+'px';
                    }
                });

                
                document.addEventListener('mouseup', function (e) { 
                    curCol = undefined;
                    nxtCol = undefined;
                    pageX = undefined;
                    nxtColWidth = undefined;
                    curColWidth = undefined
                });
            }
            



            function createDiv(height){
                var div = document.createElement('div');
                div.style.top = 0;
                div.style.right = 0;
                div.style.width = '5px';
                div.style.position = 'absolute';
                div.style.cursor = 'col-resize';
                div.style.userSelect = 'none';
                div.style.height = height + 'px';

                // div.style.background = `rgb(255,0,0)`;
                // div.style.zIndex = `30`;
                return div;
            }
            



            function paddingDiff(col){
            
                if (getStyleVal(col,'box-sizing') == 'border-box'){
                return 0;
                }
                
                var padLeft = getStyleVal(col,'padding-left');
                var padRight = getStyleVal(col,'padding-right');
                return (parseInt(padLeft) + parseInt(padRight));

            }


            function getStyleVal(elm,css){
                return (window.getComputedStyle(elm, null).getPropertyValue(css))
            }

        };
    

    } 


    onWindowResize(){

    }




    add_record(record){

        let tr = document.createElement('tr');
        // this.kfEditor.classList.add('keyFrameEditor');
      
        this.table.appendChild(tr);

        for (const [key, value] of Object.entries(record)) {
            let td = document.createElement('td');
            td.innerHTML = value;
            tr.appendChild(td);

        }
    }

    clear_table(){
        this.table.innerHTML = "";
    }
}

  

export { ResizableTable };


