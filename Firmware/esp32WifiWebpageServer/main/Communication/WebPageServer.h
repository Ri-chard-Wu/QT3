#pragma once

#include "QT3.h"

class WebPageServer{

public:

    // enum CommandName
    // {
    //     COMMAND_SET_JOINT_ANGLES = 1, 
    //     COMMAND_SET_VELOCITY_LIMIT, 
    //     COMMAND_SET_ACCELERATION, 
    //     COMMAND_SET_REDUCTION_RATIO, 
    // };


    enum CommandName
    {
        COMMAND_SET_JOINT_ANGLES = 1, 
        COMMAND_SET_VELOCITY_LIMIT, 
        COMMAND_SET_ACCELERATION, 
        COMMAND_SET_REDUCTION_RATIO,
        COMMAND_EMERGENCY_STOP,
        COMMAND_SET_JOINT_ANGLES_WITH_VELOCITY_LIMIT,
        COMMAND_REBOOT,
        COMMAND_SET_SYNC_INTERVAL,
        COMMAND_INIT_FIFO,
        COMMAND_SET_JOINT_ANGLES_WITH_VELOCITY_LIMIT_FIFO
    };


    // int trgJointAngles[7] = {0, 0, 0, 0, 0, 0, 0};

    WebPageServer(){

    }

    void register_qt3(QT3 *qt3){
        this->qt3 = qt3;
    }


    void start();

    // void print(){
    //     printf("[WebPageServer::print()]\n");
    // }

    void parseCmd();


    // int jointAngles[7] = {0, 0, 0, 0, 0, 0, 0};
    
private:

    QT3 *qt3;

    // void connect_wifi();
    
    // httpd_handle_t setup_server();

};


