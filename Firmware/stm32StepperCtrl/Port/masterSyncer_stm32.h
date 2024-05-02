

#ifndef CTRL_STEP_STM32_FW_MASTERSYNCER_STM32_H
#define CTRL_STEP_STM32_FW_MASTERSYNCER_STM32_H
#include <cstdint>

class MasterSyncer
{
public:

    MasterSyncer(uint32_t interval);

    void Tick(uint32_t _timeElapseMillis);

    void syncPos();

    void setInterval(uint32_t interval);

    uint32_t timer=0;
    uint32_t interval=100; // ms
    uint8_t TxData[8];

    // Since power-on pos is between -0.5 and 0.5, seting pos to 1 ensure a power-on sync.
    float pos = 1.0;

    bool enableSync = true;
};



#endif //CTRL_STEP_STM32_FW_MASTERSYNCER_STM32_H
