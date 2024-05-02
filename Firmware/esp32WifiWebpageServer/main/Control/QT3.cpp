 
#include "QT3.h"

  

// send request to motors, and return the angle that was read previously.
float QT3::getAngle(int j){
 

    float angle = 0;

    if( sem_curJointAngles != NULL )
    {    
        if(xSemaphoreTake(sem_curJointAngles, ( TickType_t ) 10 ) == pdTRUE){

            angle = curJointAngles[j];

            xSemaphoreGive(sem_curJointAngles); 
        }
        else{ 
            angle = 0;
        }
    }
    else{
        angle = 0;
    }
 
    return angle;
}


void QT3::_getAngle(int j){

    motors[j]->getAngle();
 
}


bool QT3::isAngleChanged(int j){
    if(std::abs(jaMaster[j] - curJointAngles[j]) > 0.01) return true; 
    else return false;
}

void QT3::setAngle(int j, float angle){
    
    motors[j]->setAngle(angle); 
}




void QT3::setAngleWithVelocityLimit(int j, float pos, float vel){
    motors[j]->setAngleWithVelocityLimit(pos, vel);
}


void QT3::setVelocityLimit(int j, float vel){

    motors[j]->setVelocityLimit(vel);
}


void QT3::setAcceleration(int j, float acc){

    motors[j]->setAcceleration(acc);
}

     

void QT3::setReductionRatio(int j, float redRatio){

    motors[j]->setReductionRatio(redRatio);
}


float QT3::getReductionRatio(int j){
    return motors[j]->getReductionRatio();
}
 
 

void QT3::setSyncInterval(int j, int interval){
    
    motors[j]->setSyncInterval(interval); 
   
}
 
 