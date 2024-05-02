

#include "Motor.h"
#include "common_inc.h"

Motor::Motor(uint8_t nodeId, float reductionRatio){

    this->nodeId = nodeId;
    this->nodeId2 = nodeId;

    this->reductionRatio = reductionRatio;
  
}


 
static uint8_t cmd;
static uint8_t txData[8];

 
void Motor::setAngle(float angleDEG){ // angleDEG: changed to circle fraction.

   
    txData[4] = 1; // need ack from motors.

    cmd = 0x05;
 
    float data = angleDEG;
 
    for(int i = 0; i < 4; i++){
        txData[i] = ((uint8_t *)&data)[i];
    }
 
    canCtrl.sendMsg(nodeId << 7 | cmd, txData, 5);
}




void Motor::setAngleWithVelocityLimit(float pos, float vel){

    
    printf("[Motor.cpp] j%d: pos: %f, vel: %f\n", this->nodeId, pos, vel);
 
    cmd = 0x07;
  
 
    for(int i = 0; i < 4; i++){
        txData[i] = ((uint8_t *)&pos)[i];
    }
     
    if(vel > SPEED_MAX) vel = SPEED_MAX;
    for(int i = 0; i < 4; i++){
        txData[i+4] = ((uint8_t *)&vel)[i];
    }
 
    canCtrl.sendMsg(nodeId << 7 | cmd, txData, 8);
     
}



void Motor::getAngle(){ 
    cmd = 0x23;
    canCtrl.sendMsg(nodeId << 7 | cmd, NULL, 0);
}
 
 
void Motor::setVelocityLimit(float vel){
    if(vel > SPEED_MAX) vel = SPEED_MAX; 

    // float vel_float = 3.5;
 
    txData[4] = 1;

    cmd = 0x13;
    for(int i = 0; i < 4; i++){
        // txData[i] = ((uint8_t *)&vel)[i];
        txData[i] = ((uint8_t *)&vel)[i];
    }
    canCtrl.sendMsg(nodeId << 7 | cmd, txData, 5);

    printf("[Motor.cpp] id: %d, velLimit: %f\n", nodeId, vel);
}



void Motor::setAcceleration(float acc){ 

    if(acc > VELACC_MAX) acc = VELACC_MAX; 
     
    txData[4] = 1;

    cmd = 0x14;
    for(int i = 0; i < 4; i++){
        txData[i] = ((uint8_t *)&acc)[i];
    } 
    canCtrl.sendMsg(nodeId << 7 | cmd, txData, 5); 

    printf("[Motor.cpp] id: %d, acc: %f\n", nodeId, acc);
}


 
void Motor::setReductionRatio(float rr){
    this->reductionRatio = rr;
}


float Motor::getReductionRatio(){
    return this->reductionRatio;
}


void Motor::emergencyStop(){
    
    cmd = 0x01;
    int enabled = 0;
    for(int i = 0; i < 4; i++){
        txData[i] = ((uint8_t *)&enabled)[i];
    }
    canCtrl.sendMsg(nodeId << 7 | cmd, txData, 4);

}


void Motor::setSyncInterval(int interval){
        
    printf("[Motor.cpp] id: %d, set sync interval: %d ms\n", nodeId, interval);

    cmd = 0x25;
    for(int i = 0; i < 4; i++){
        txData[i] = ((uint8_t *)&interval)[i];
    }
    canCtrl.sendMsg(nodeId << 7 | cmd, txData, 4);
}