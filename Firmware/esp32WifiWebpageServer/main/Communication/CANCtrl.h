#pragma once
#include <stdint.h>
#include "common_inc.h"

class CANCtrl{

public:


    CANCtrl();

    void sendMsg(uint32_t id, uint8_t *data, uint8_t dataSz);
 
private:

};



extern CANCtrl canCtrl;


