

#include "web_page_content.h"
#include "startServer.h"
#include "common_inc.h"



#ifndef MIN
#define MIN(a, b) (((a) < (b)) ? (a) : (b))
#endif



QueueHandle_t cmdQueue;
struct Command cmd;

int jointAnglesBuf[] = {0, 0, 0, 0, 0, 0, 0};


esp_err_t getRootWebPage(httpd_req_t *req)
{
    int response;
    response = httpd_resp_send(req, root_web_page, HTTPD_RESP_USE_STRLEN);
    return response;
}


esp_err_t _parseGET(httpd_req_t *req)
{

   

    char *resp = parseGET(req->uri);
  
 
    int response;
    response = httpd_resp_send(req, resp, HTTPD_RESP_USE_STRLEN);
    return response;    

}
 


esp_err_t receiveCmd(httpd_req_t *req)
{
   
 
    int ret;
    int remaining = req->content_len;


    while (remaining > 0) {


        // `ret` will be number of bytes readed. If < 0, there is error.
        if ( ( ret = httpd_req_recv(req, cmd.cmdData, MIN(remaining, sizeof(cmd.cmdData)) ) ) <= 0) {
            if (ret == HTTPD_SOCK_ERR_TIMEOUT) continue;
            return ESP_FAIL;
        }

        remaining -= ret;
    }


    // printf("cmd.cmdData: %s\n", cmd.cmdData);

    // printf("[receiveCmd()] cmd: %s\n", cmd.cmdData);

    xQueueSend( /* The handle of the queue. */
               cmdQueue,
               /* The address of the xMessage variable.  sizeof( struct AMessage )
               bytes are copied from here into the queue. */
               ( void * ) &cmd,
               /* Block time of 0 says don't block if the queue is already full.
               Check the value returned by xQueueSend() to know if the message
               was sent to the queue successfully. */
               ( TickType_t ) 0 );


    httpd_resp_send_chunk(req, NULL, 0);
    return ESP_OK;
}



httpd_uri_t uri_getRootWebPage = {
    .uri = "/",
    .method = HTTP_GET,
    .handler = getRootWebPage,
    .user_ctx = NULL
};

httpd_uri_t uri_get = {
    .uri = "/get*",
    .method = HTTP_GET,
    .handler = _parseGET,
    .user_ctx = NULL
};



httpd_uri_t uri_receiveCmd = {
    .uri       = "/sendCmd",
    .method    = HTTP_POST,
    .handler   = receiveCmd,
    .user_ctx  = NULL
};




httpd_handle_t setup_server(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.uri_match_fn = httpd_uri_match_wildcard;
    httpd_handle_t server = NULL;
    // config.task_priority = 10;

    // printf("config.task_priority: %d\n", config.task_priority);

    if (httpd_start(&server, &config) == ESP_OK)
    {
  
        httpd_register_uri_handler(server, &uri_getRootWebPage);
        httpd_register_uri_handler(server, &uri_get);
        httpd_register_uri_handler(server, &uri_receiveCmd);
 
    }

    return server;
}


static EventGroupHandle_t s_wifi_event_group;
static int s_retry_num = 0;

static void event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        if (s_retry_num < CONFIG_ESP_MAXIMUM_RETRY)
        {
            esp_wifi_connect();
            s_retry_num++;
        }
        else
        {
            xEventGroupSetBits(s_wifi_event_group, BIT1);
        }
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI("espressif", "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(s_wifi_event_group, BIT0);
    }
}

void connect_wifi(void)
{
    s_wifi_event_group = xEventGroupCreate();

    ESP_ERROR_CHECK(esp_netif_init());

    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &event_handler,
                                                        NULL,
                                                        &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &event_handler,
                                                        NULL,
                                                        &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = CONFIG_ESP_WIFI_SSID,
            .password = CONFIG_ESP_WIFI_PASSWORD,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());


    /* Waiting until either the connection is established (BIT0) or connection failed for the maximum
     * number of re-tries (BIT1). The bits are set by event_handler() (see above) */
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
                                           BIT0 | BIT1,
                                           pdFALSE,
                                           pdFALSE,
                                           portMAX_DELAY);
    
    vEventGroupDelete(s_wifi_event_group);
}

void init_nfs(){

    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

}
