
#pragma once


#ifdef __cplusplus
extern "C" {
#endif


#include <unistd.h>
#include "esp_system.h"
#include "esp_spi_flash.h"
#include <esp_http_server.h>

#include "esp_wifi.h"
#include "esp_event.h"
#include "freertos/event_groups.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"

#include <lwip/sockets.h>
#include <lwip/sys.h>
#include <lwip/api.h>
#include <lwip/netdb.h>



void connect_wifi(void);
httpd_handle_t setup_server(void);
void init_nfs();



struct Command
{
    char cmdID;
    char cmdData[127];
};

  
  
extern char* parseGET(char *uri);


#ifdef __cplusplus
}
#endif

