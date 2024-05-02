



#include "common_inc.h"
#include "WebPageServer.h"
#include "QT3.h"




WebPageServer wpServer;
QT3 qt3;



TaskHandle_t wpServer_update_task_handle = NULL;

void wpServer_update_task(void *arg)
{
    while(1){
        wpServer.parseCmd(); 
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}


TaskHandle_t sync_task_handle = NULL;
void sync_task(void *arg)
{
    while(1){
 
        qt3.sync_task();

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

 


extern "C" void Main(void){

    printf("[Main()] \n");



    wpServer.register_qt3(&qt3);
    
    wpServer.start();
 


                            
    xTaskCreate(wpServer_update_task,       // func
                "wpServer_update_task",     // name
                4096,                         // stack size
                NULL,                         // arg
                10,                           // priority
                &wpServer_update_task_handle // task handle
            );
                            
    xTaskCreate(sync_task,       // func
                "sync_task",     // name
                4096,                         // stack size
                NULL,                         // arg
                10,                           // priority
                &sync_task_handle // task handle
            );

}