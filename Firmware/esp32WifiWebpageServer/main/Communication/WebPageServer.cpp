

#include "common_inc.h"
#include "WebPageServer.h"
#include "startServer.h"
 

extern QueueHandle_t cmdQueue;
 
void WebPageServer::start(){

    printf("[WebPageServer::start()]\n");

    init_nfs();
    connect_wifi();
    setup_server();


    cmdQueue = xQueueCreate( 20, 128 ); 

}



void WebPageServer::parseCmd(){

    struct Command cmd;

    // wait 1000000 ticks should the queue be emtpy.
    if( xQueueReceive( cmdQueue,
                        &( cmd ),
                        ( TickType_t ) 10 ) == pdPASS )    
    { 

        printf("[WebPageServer.cpp] cmd: %s\n", cmd.cmdData);
        

        const char sp[4] = ";=,";
        
        CommandName cmdName = (CommandName)atoi(strtok(cmd.cmdData, sp));

        float angleDEG_float;

        int jointIdx_int;
        int tmpI;
        float tmpF;

        char *jointIdx;
        char *angleDEG;
        char *speed;
        char *velAcc;        


 

        switch(cmdName){

            case COMMAND_SET_JOINT_ANGLES:
 
                jointIdx = strtok(NULL, sp);
                
             
                while(jointIdx != NULL){

                    angleDEG = strtok(NULL, sp);
                    jointIdx_int = atoi(jointIdx);
 
                    printf("jointIdx: %s, angleDEG: %s\n", jointIdx, angleDEG);
                    if(jointIdx_int >= 1 && jointIdx_int <= 6){
 

                        angleDEG_float = (float) atof(angleDEG);  
                        qt3->setAngle(jointIdx_int, angleDEG_float);
 
                    }
                    
                    jointIdx = strtok(NULL, sp);
                   
                    
                
                }        

                break;
  

            case COMMAND_SET_VELOCITY_LIMIT:

                jointIdx = strtok(NULL, sp);
                speed = strtok(NULL, sp); 
            
                while(jointIdx != NULL){

                    jointIdx_int = atoi(jointIdx);

                    if(jointIdx_int >= 1 && jointIdx_int <= 6){
 
                        qt3->setVelocityLimit(jointIdx_int, atof(speed));
                    }
                    
                    jointIdx = strtok(NULL, sp);
                    speed = strtok(NULL, sp); 
                } 
 
                break;   

            case COMMAND_SET_ACCELERATION:

                jointIdx = strtok(NULL, sp); 
                velAcc = strtok(NULL, sp);
            
                while(jointIdx != NULL){

                    jointIdx_int = atoi(jointIdx);

                    if(jointIdx_int >= 1 && jointIdx_int <= 6){

                        qt3->setAcceleration(jointIdx_int, atof(velAcc));
                    }
                    
                    jointIdx = strtok(NULL, sp); 
                    velAcc = strtok(NULL, sp);
                } 
 
                break;   



            case COMMAND_SET_REDUCTION_RATIO: 

                jointIdx = strtok(NULL, sp);
                angleDEG = strtok(NULL, sp);
            
                while(jointIdx != NULL){

                    jointIdx_int = atoi(jointIdx);
 

                    if(jointIdx_int >= 1 && jointIdx_int <= 6){

                        qt3->setReductionRatio(jointIdx_int, (float) atof(angleDEG));
                    }
                    
                    jointIdx = strtok(NULL, sp);
                    angleDEG = strtok(NULL, sp);
                
                }                         
 
                break; 

            


            case COMMAND_EMERGENCY_STOP: 

                qt3->emergencyStop();
                break;      


            case COMMAND_SET_JOINT_ANGLES_WITH_VELOCITY_LIMIT: 
 
                jointIdx = strtok(NULL, sp);

 
                while(jointIdx != NULL){

                    angleDEG = strtok(NULL, sp);
                    speed = strtok(NULL, sp); 
                    
                    jointIdx_int = atoi(jointIdx);
 
 
                    if(jointIdx_int >= 1 && jointIdx_int <= 6){
                   
                        qt3->setAngleWithVelocityLimit(jointIdx_int, atof(angleDEG), atof(speed));
                  
                    }
                     
                    
                    jointIdx = strtok(NULL, sp);
                }        

                                
                break;   


            case COMMAND_REBOOT: 
 
                qt3->reboot();
                                
                break;  
                
            case COMMAND_SET_SYNC_INTERVAL: 
 
                jointIdx = strtok(NULL, sp);
                while(jointIdx != NULL){

                    tmpI = atoi(strtok(NULL, sp)); 
                    jointIdx_int = atoi(jointIdx); 
 
                    if(jointIdx_int >= 1 && jointIdx_int <= 6){
                        qt3->setSyncInterval(jointIdx_int, tmpI);
                    } 
                    
                    jointIdx = strtok(NULL, sp);
                }        

                                
                break;  

            case COMMAND_INIT_FIFO:
                qt3->initFIFO();
                break; 

            case COMMAND_SET_JOINT_ANGLES_WITH_VELOCITY_LIMIT_FIFO: 
 
                jointIdx = strtok(NULL, sp);

                qt3->newFIFOEntry();

                while(jointIdx != NULL){

                    angleDEG = strtok(NULL, sp);
                    speed = strtok(NULL, sp); 
                    
                    jointIdx_int = atoi(jointIdx);
 
 
                    if(jointIdx_int >= 1 && jointIdx_int <= 6){
                        qt3->setAngleWithVelocityLimitFIFO(jointIdx_int, atof(angleDEG), atof(speed));
                  
                    }
                     
                    
                    jointIdx = strtok(NULL, sp);
                
                }       
                
                qt3->commitFIFOEntry();
                                
                break;                                            
        }
 


    }
}

