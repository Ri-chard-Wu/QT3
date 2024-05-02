
#include "can.h"
#include "esp_err.h"
#include "esp_log.h"
#include "driver/twai.h"
#include "interface_can.h"

void can_init(){

    // CAN_SJW_1TQ: 0
    // CAN_BS1_5TQ: 262144
    // CAN_BS2_3TQ: 2097152


    /* TWAI_TIMING_CONFIG_25KBITS:
    {.clk_src = TWAI_CLK_SRC_DEFAULT, 
        .quanta_resolution_hz = 625000, 
        .brp = 0, 
        .tseg_1 = 16, 
        .tseg_2 = 8, 
        .sjw = 3, 
        .triple_sampling = false}
    */
    twai_timing_config_t t_config = TWAI_TIMING_CONFIG_25KBITS();
    // for MCU’s on a CAN bus to communicate they must have same bit rate (bits/s or baud rate).
        // follow cfg has bit rate of 5000000 / (1 + 2 + 2) == 1000000, same as stm32f103's.
    t_config.quanta_resolution_hz = 5000000; 
    // t_config.brp = 4;
    t_config.sjw = 1;
    t_config.tseg_1 = 2;
    t_config.tseg_2 = 2;


    /* TWAI_FILTER_CONFIG_ACCEPT_ALL:
    {
        .acceptance_code = 0, 
        .acceptance_mask = 0xFFFFFFFF, 
        .single_filter = true
    }
    */
    twai_filter_config_t f_config = TWAI_FILTER_CONFIG_ACCEPT_ALL();


    /* TWAI_GENERAL_CONFIG_DEFAULT(tx_io_num, rx_io_num, op_mode):
    {
        .mode = op_mode, 
        .tx_io = tx_io_num, 
        .rx_io = rx_io_num,        
        .clkout_io = TWAI_IO_UNUSED, 
        .bus_off_io = TWAI_IO_UNUSED,      
        .tx_queue_len = 5, 
        .rx_queue_len = 5,                           
        .alerts_enabled = TWAI_ALERT_NONE,  
        .clkout_divider = 0,        
        .intr_flags = ESP_INTR_FLAG_LEVEL1}

    */

    // Tx: pin 21, Rx: pin 22
    twai_general_config_t g_config = TWAI_GENERAL_CONFIG_DEFAULT(21, 22, TWAI_MODE_NORMAL);
    
    ESP_ERROR_CHECK(twai_driver_install(&g_config, &t_config, &f_config));
    ESP_LOGI("TWAI Master", "Driver installed");

    // ESP_ERROR_CHECK(twai_start());  
    ESP_ERROR_CHECK(twai_start());
    ESP_LOGI("TWAI Master", "Driver started");      
}



// typedef struct {
//     union {
//         struct {
//             //The order of these bits must match deprecated message flags for compatibility reasons
//             uint32_t extd: 1;           /**< Extended Frame Format (29bit ID) */
//             uint32_t rtr: 1;            /**< Message is a Remote Frame, if set to one, it means this node is requesting data from another node. */
//             uint32_t ss: 1;             /**< Transmit as a Single Shot Transmission. Unused for received. */
//             uint32_t self: 1;           /**< Transmit as a Self Reception Request. Unused for received. */
//             uint32_t dlc_non_comp: 1;   /**< Message's Data length code is larger than 8. This will break compliance with ISO 11898-1 */
//             uint32_t reserved: 27;      /**< Reserved bits */
//         };
//         //Todo: Deprecate flags
//         uint32_t flags;                 /**< Deprecated: Alternate way to set bits using message flags */
//     };
//     uint32_t identifier;                /**< 11 or 29 bit identifier */
//     uint8_t data_length_code;           /**< Data length code */
//     uint8_t data[TWAI_FRAME_MAX_DLC];    /**< Data bytes (not relevant in RTR frame) */
// } twai_message_t;



static twai_message_t txMsg;
static twai_message_t rxMsg;


void can_sendMsg(uint32_t id, uint8_t *data, uint8_t dataSz){
    
    // id = nodeId << 7 | cmd; 

    // uint8_t mask = 0x7F;
    // int nodeId = id >> 7;
    // uint8_t cmd = id & mask;
    // int angle = ((int *)data)[0];

    // printf("[can_sendMsg()] nodeId: %d, cmd: %d, angle: %d\n", nodeId, (int)cmd, angle);

    // txMsg.identifier = 3 << 7;
    txMsg.identifier = id;
    txMsg.extd = 0;
    txMsg.rtr = 0;
    txMsg.data_length_code = 8;

    for(int i = 0; i < dataSz; i++){
        txMsg.data[i] = data[i];
    }

    twai_transmit(&txMsg, portMAX_DELAY);    

}



TaskHandle_t can_receive_task_handle = NULL;

void can_receive_task(void *arg){
    
    twai_reconfigure_alerts(TWAI_ALERT_RX_DATA, NULL);    

    while(1){
 

        uint32_t alerts;
        twai_read_alerts(&alerts, portMAX_DELAY);

        if (alerts & TWAI_ALERT_RX_DATA) {

            
            twai_receive(&rxMsg, portMAX_DELAY);


            uint8_t mask = 0x7F;
            int nodeId = rxMsg.identifier >> 7;
            uint8_t cmd = rxMsg.identifier & mask;
            itf_can_parse_rx_msg(nodeId, cmd, rxMsg.data);
            
        }
    }
}

