
#pragma once

#include "Motor.h"
#include "common_inc.h"
#include "startServer.h"
#include "driver/gpio.h"

#include <queue>
#define RESET_PIN    18 // gpio 0.
 

class QT3{

public:

    QT3(){ 
  
        
        fifoHelper = new FIFOHelper(this);

        sem_trgJointAngles = xSemaphoreCreateMutex();
        sem_curJointAngles = xSemaphoreCreateMutex();
         
        for(int i = 1; i <= 6; i++){
            motors[i] = new Motor(i, 30.0);
 
        } 

        initGPIO();

    } 

    void initGPIO(){
  
        //zero-initialize the config structure.
        gpio_config_t io_conf = {};
        //disable interrupt
        io_conf.intr_type = GPIO_INTR_DISABLE;
        //set as output mode
        io_conf.mode = GPIO_MODE_OUTPUT;
        //bit mask of the pins that you want to set,e.g.GPIO18/19
        io_conf.pin_bit_mask = (1ULL << RESET_PIN);
        //disable pull-down mode
        io_conf.pull_down_en = (gpio_pulldown_t)0;
        //disable pull-up mode
        io_conf.pull_up_en = (gpio_pullup_t)0;
        //configure GPIO with the given settings
        gpio_config(&io_conf);
    }

    void setSyncInterval(int j, int interval);
    
    void reboot(){
        
        gpio_set_level((gpio_num_t) RESET_PIN, 1);
        vTaskDelay(500 / portTICK_PERIOD_MS);
        gpio_set_level((gpio_num_t) RESET_PIN, 0);

    }
 


    void setAllJointAngles();
    void setAngle(int j, float angle);
    void setAngleWithVelocityLimit(int j, float pos, float vel);

 


    float getAngle(int j); 
    void _getAngle(int j); 
    

    bool isAngleChanged(int j);

    void setVelocityLimit(int j, float vel);
    void setAcceleration(int j, float acc);
    
    void emergencyStop(){

        for(int i = 1; i <= 6; i++){
    
            motors[i]->emergencyStop(); 
        }

    }


    void setReductionRatio(int j, float redRatio);

    float getReductionRatio(int j);


    void sync_task(){
 
        for(int j=1;j<7;j++){
            _getAngle(j);
        }

        fifoHelper->sync_task();

       
    }

    void initFIFO(){
        fifoHelper->init();
    }


    void setAngleWithVelocityLimitFIFO(int j, float pos, float vel){
        fifoHelper->setAngleWithVelocityLimit(j, pos, vel);
    }

    void newFIFOEntry(){
        fifoHelper->newEntry();
    }
    bool commitFIFOEntry(){
        return fifoHelper->commitEntry();
    }

    int getFifoLength(){
        return fifoHelper->getFifoLength();
    }


    class FIFOHelper{

    public:

        FIFOHelper(QT3 *qt3){ 
            this->qt3 = qt3;
            

            sem_fifo = xSemaphoreCreateMutex();
        }
        
        void init(){
            clear();
        }

        void emergencyStop(){
            // clear();
            // enabled = false;
        }


        void clear(){

            if(target){
                delete target;   
                target = NULL;
            } 

            if(newEntryPtr){
                delete newEntryPtr;   
                newEntryPtr = NULL;
            } 
 

            if( sem_fifo != NULL )
            {    
                if(xSemaphoreTake(sem_fifo, ( TickType_t ) 1000000 ) == pdTRUE){ 
                    
                    int n = posVelFifo.size();
                    for(int i=0;i<n;i++) posVelFifo.pop();
                    xSemaphoreGive(sem_fifo); 
                } 
            } 
        }


        int getFifoLength(){

            int size;

            if( sem_fifo != NULL )
            {    
                if(xSemaphoreTake(sem_fifo, ( TickType_t ) 100 ) == pdTRUE){ 
                    size = posVelFifo.size();
            
                    xSemaphoreGive(sem_fifo);    
                }
                else { 
                    printf("[a] get fifo len fail to get sem\n");
                    size = maxFifoSize;
                }
            }
            else  size = maxFifoSize;


            return size;
        }


        void sync_task(){
    
            int size;
        
            if( sem_fifo != NULL )
            {    
                if(xSemaphoreTake(sem_fifo, ( TickType_t ) 100 ) == pdTRUE){ 
                    size = posVelFifo.size();
                    // printf("sem can get size\n");
                    xSemaphoreGive(sem_fifo);    
                }
                else { 
                    printf("[a] get size fail to get sem\n");
                    return;
                }
            }
            else  return;
            

            if(size > 0){
                
                bool allDone = true;
                if(target){
                    for(int j = 1;j<7;j++){

                        if(target->vel[j-1] < 0) continue;
                        
                        // 0.01: (motor) within 3.6 deg, or 0.12 deg for r30 reducer output,
                            // or 0.06 deg for r60 reducer.
                        float cur = qt3->getAngle(j);
                        float delta = std::abs(target->pos[j-1] - cur);
                        if(delta < 0.2){ 
                            target->vel[j-1] = -1;
                            continue;
                        }                
                        
                        allDone = false;
                        break;
                    }
 
                    if(allDone){
                        delete target;   
                        target = NULL;
                    }
                }


                if(allDone){
    
                    if( sem_fifo != NULL )
                    {    
                        if(xSemaphoreTake(sem_fifo, ( TickType_t ) 100 ) == pdTRUE){ 
                                        
                            target = posVelFifo.front();
                            posVelFifo.pop();
                            printf("[QT3.h] pop size: %d\n", posVelFifo.size());

                            xSemaphoreGive(sem_fifo);    
                        }
                        else{ 
                            printf("[a] fail to get sem\n");
                            return;
                        }
                    }
                    else  return;                
    
                    for(int j = 1;j<7;j++){ 
                        if(target->vel[j-1] < 0) continue;
                        qt3->setAngleWithVelocityLimit(j, target->pos[j-1], target->vel[j-1]);

                    }
    
                }
            }
        }



        void newEntry(){
            if(newEntryPtr){
                printf("[QT3.h] WARNING: newEntry already exist.\n");
                return;
            }

            newEntryPtr = new posVel();
            for(int j=1;j<7;j++){
                newEntryPtr->vel[j-1] = -1;
            } 
        }

        void setAngleWithVelocityLimit(int j, float pos, float vel){
            if(!newEntryPtr){
                printf("[QT3.h] WARNING: no newEntry.\n");
                return;
            }

            newEntryPtr->pos[j-1] = pos;
            newEntryPtr->vel[j-1] = vel;
        }
    

        bool commitEntry(){
            
            if(!newEntryPtr){
                printf("[QT3.h] WARNING: no newEntry to commit.\n");
                return false;
            }


            if( sem_fifo != NULL )
            {    
                if(xSemaphoreTake(sem_fifo, ( TickType_t ) 100 ) == pdTRUE){

                    if(posVelFifo.size() < maxFifoSize){
                        posVelFifo.push(newEntryPtr);

                        printf("[QT3.h] push size: %d\n", posVelFifo.size());

                        newEntryPtr = NULL;
                        xSemaphoreGive(sem_fifo); 
                        return true;
                    } 
                    else{
                        printf("[QT3.h] Warning: commit failed.");
                        delete newEntryPtr;
                        newEntryPtr = NULL;
                        xSemaphoreGive(sem_fifo); 
                        return false;                     
                    }
                }
                else{
                    printf(" commit fail to get sem\n");
                    // printf("[QT3.h] Warning: commit failed.");
                    delete newEntryPtr;
                    newEntryPtr = NULL;
                    return false;
                }
            }
            else{
                printf("[QT3.h] Warning: commit failed.");
                delete newEntryPtr;
                newEntryPtr = NULL;
                return false;
            } 
        }


        
        struct posVel{
            float pos[6];
            float vel[6];
        };
        
        QT3 *qt3;
        
        int maxFifoSize = 20;
        std::queue<posVel *> posVelFifo; 

        posVel *target = NULL;
        posVel *newEntryPtr = NULL;

        SemaphoreHandle_t sem_fifo = NULL;

        bool enabled = true;
    };


 

    FIFOHelper *fifoHelper;

    SemaphoreHandle_t sem_trgJointAngles = NULL;
    SemaphoreHandle_t sem_curJointAngles = NULL;

    float curJointAngles[7] = {0, 0, 0, 0, 0, 0, 0};
    float jaMaster[7] = {0, 0, 0, 0, 0, 0, 0};
 
    uint8_t JointAnglesNeedUpdate = 0; 
private:
    Motor *motors[7];
     
};








