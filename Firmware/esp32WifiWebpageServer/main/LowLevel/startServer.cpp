#include "startServer.h"
#include "QT3.h"

extern QT3 qt3;



enum GETName
{
    GET_ANGLE = 1,
    GET_ANGLE_IF_CHANGED,
    GET_FIFO_LENGTH,
    
};

char respGET[64];
char *respGETPtr;

extern char* parseGET(char *uri){    

    const char sp[5] = ":;=,";

    char *arg;
    int argInt;
    int tmpI;
 
    char buf[16];
 
    strtok(uri, sp);

    GETName getName = (GETName)atoi(strtok(NULL, sp));

    switch(getName){

        case GET_ANGLE:

            arg = strtok(NULL, sp);
            if(arg != NULL){
                argInt = atoi(arg);
                sprintf(respGET, "%d=%f",  argInt, qt3.getAngle(argInt));    

                // printf("1 respGET: %s\n", respGET);
                while(true){

                    arg = strtok(NULL, sp);
                    if(arg != NULL){
                        argInt = atoi(arg);
                        
                        sprintf(buf, ",%d=%f",  argInt, qt3.getAngle(argInt));
                      
                        strcat(respGET, buf);      
                        // printf("2 respGET: %s\n", respGET);   
                    }
                    else break;                 
                }  
                
            }  
            break;


        case GET_ANGLE_IF_CHANGED:
 
            arg = strtok(NULL, sp); 
            respGET[0] = '\0';
            while(arg != NULL){
                argInt = atoi(arg);
                if(qt3.isAngleChanged(argInt)){
        
                    sprintf(buf, ",%d=%f", argInt, qt3.getAngle(argInt));
                    strcat(respGET, buf);
                }
                arg = strtok(NULL, sp);        
            }

            break;        

        case GET_FIFO_LENGTH:
            sprintf(respGET, "%d", qt3.getFifoLength());
            break;
    }
 
    // respGET[0] = 9;
    return respGET;
}
