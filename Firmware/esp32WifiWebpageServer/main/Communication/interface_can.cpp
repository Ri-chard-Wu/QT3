
#include "interface_can.h"
#include "QT3.h"
#include "common_inc.h"


extern QT3 qt3;
 
extern "C" void itf_can_parse_rx_msg(uint8_t id, uint8_t cmd, uint8_t *data){

   
    switch(cmd){

        case 0x23: // a motor returns its current angle.

   
            
            if( qt3.sem_curJointAngles != NULL ){
 
                if(xSemaphoreTake(qt3.sem_curJointAngles, ( TickType_t ) 0 ) == pdTRUE){
                    
                    if(id <=6 && id >= 1){

                        float circleFraction = ((float *)data)[0];
                         
                        qt3.curJointAngles[id] = circleFraction; 
                    }

                    xSemaphoreGive(qt3.sem_curJointAngles); 
                }
                
            }

 
            break;
    }
}
