



#include "common_inc.h"
#include "configurations.h"
#include <cmath>
#include <can.h>

MasterSyncer::MasterSyncer(uint32_t interval)
{

    this->interval = interval;
}


extern Motor motor;
static CAN_TxHeaderTypeDef txHeader =
        {
                .StdId = 0x00,
                .ExtId = 0x00,
                .IDE = CAN_ID_STD,
                .RTR = CAN_RTR_DATA,
                .DLC = 8,
                .TransmitGlobalTime = DISABLE
        };


void MasterSyncer::Tick(uint32_t _timeElapseMillis){

    if(!enableSync) return;


    timer += _timeElapseMillis;
    float tmpF;

    if(timer >= interval){

        timer = 0;

        syncPos();

    }
}


void MasterSyncer::syncPos(){

    float pos_next = motor.controller->GetPosition();

    if(std::abs(pos - pos_next) < 0.001) return;

    pos = pos_next;

    auto* b = (unsigned char*) &pos;
    for (int i = 0; i < 4; i++)
        TxData[i] = *(b + i);

    txHeader.StdId = (boardConfig.canNodeId << 7) | 0x23;
    CAN_Send(&txHeader, TxData);
}


void MasterSyncer::setInterval(uint32_t interval){
    this->interval = interval;
}

























