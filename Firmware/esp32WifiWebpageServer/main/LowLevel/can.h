
#pragma once


#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include "common_inc.h"

void can_init();

void can_sendMsg(uint32_t id, uint8_t *data, uint8_t dataSz);


extern TaskHandle_t can_receive_task_handle;
void can_receive_task(void *arg);

#ifdef __cplusplus
}
#endif

