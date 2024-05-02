
#pragma once

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

void itf_can_parse_rx_msg(uint8_t id, uint8_t cmd, uint8_t *data);

#ifdef __cplusplus
}
#endif

