

#pragma once

#include "CANCtrl.h"
 

class Motor{

public:

    Motor(uint8_t nodeId, float reductionRatio);


    void setAngle(float angle);
    void setAngleWithVelocityLimit(float pos, float vel);

    void getAngle();
    
    // void setVelocity(int speed, int velAcc);
    void setVelocityLimit(float vel);
    void setAcceleration(float acc);

    void emergencyStop();
   
    void setReductionRatio(float rr);
    float getReductionRatio();

    
    void setSyncInterval(int interval);


    uint8_t nodeId;
    uint8_t nodeId2;
    float SPEED_MAX = 5;
    float VELACC_MAX = 60;    
    float reductionRatio;

};


