#include "can.h"
#include "CANCtrl.h"



CANCtrl::CANCtrl(){
 
    can_init();


}

void CANCtrl::sendMsg(uint32_t id, uint8_t *data, uint8_t dataSz){

    can_sendMsg(id, data, dataSz);
 

}



CANCtrl canCtrl;

 



