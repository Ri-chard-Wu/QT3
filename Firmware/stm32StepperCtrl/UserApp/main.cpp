#include "common_inc.h"
#include "configurations.h"
#include "Platform/Utils/st_hardware.h"
#include <tim.h>


/* Component Definitions -----------------------------------------------------*/
BoardConfig_t boardConfig;
Motor motor;
TB67H450 tb67H450;
MT6816 mt6816;
EncoderCalibrator encoderCalibrator(&motor);
Button button1(1, 1000), button2(2, 3000);
MasterSyncer masterSyncer(5000);


void OnButton1Event(Button::Event _event);
void OnButton2Event(Button::Event _event);
Led statusLed;


/* Main Entry ----------------------------------------------------------------*/
void Main()
{
    printf("\n\n----------------Main()------------------\n\n\r");


    uint64_t serialNum = GetSerialNumber();


    printf("serialNum: %llu\n\r", serialNum);

    uint16_t defaultNodeID = 0;
    // Change below to fit your situation
    switch (serialNum)
    {
        case 80823322358855: //J1, ok
            defaultNodeID = 1;
            printf("I am J1\n\r");
            break;
        case 155533759436114: //J2, ok
            defaultNodeID = 2;
            printf("I am J2\n\r");
            break;
        case 155530791440457: //J3, ok.
            defaultNodeID = 3;
            printf("I am J3\n\r");
            break;
        case 155632746583122: //J4, ok
            defaultNodeID = 4;
            printf("I am J4\n\r");
            break;
        case 80780353811527: //J5, ok
            defaultNodeID = 5;
            printf("I am J5\n\r");
            break;
        case 80823321244743: //J6, ok
            defaultNodeID = 6;
            printf("I am J6\n\r");
            break;
        default:
            printf("I am J?\n\r");
            break;
    }


    /*---------- Apply EEPROM Settings ----------*/
    // Setting priority is EEPROM > Motor.h
    EEPROM eeprom;
    eeprom.get(0, boardConfig);



    if (boardConfig.configStatus != CONFIG_OK) // use default settings
    {


        boardConfig = BoardConfig_t{
            .configStatus = CONFIG_OK,
            .canNodeId = defaultNodeID,
            .encoderHomeOffset = 0,
            .defaultMode = Motor::MODE_COMMAND_POSITION,
            .currentLimit = 1 * 1000,    // A
            .velocityLimit = 1 * motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS, // r/s
            .velocityAcc = 1 * motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS,   // r/s^2
            .calibrationCurrent=2000,
            .dce_kp = 200,
            .dce_kv = 80,
            .dce_ki = 300,
            .dce_kd = 250,
            .enableMotorOnBoot=false,
            .enableStallProtect=false
        };

        eeprom.put(0, boardConfig);
    }



//    motor.config.motionParams.ratedVelocity = (*(int*)RxData) * motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS;
//    motor.motionPlanner.positionTracker.SetVelocityAcc((*(int*)(RxData+4)) * motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS);

    motor.config.motionParams.encoderHomeOffset = boardConfig.encoderHomeOffset;
    motor.config.motionParams.ratedCurrent = boardConfig.currentLimit;
    motor.config.motionParams.ratedVelocity = boardConfig.velocityLimit;
    motor.config.motionParams.ratedVelocityAcc = boardConfig.velocityAcc;
    motor.motionPlanner.velocityTracker.SetVelocityAcc(boardConfig.velocityAcc);
    motor.motionPlanner.positionTracker.SetVelocityAcc(boardConfig.velocityAcc);
    motor.config.motionParams.caliCurrent = boardConfig.calibrationCurrent;
    motor.config.ctrlParams.dce.kp = boardConfig.dce_kp;
    motor.config.ctrlParams.dce.kv = boardConfig.dce_kv;
    motor.config.ctrlParams.dce.ki = boardConfig.dce_ki;
    motor.config.ctrlParams.dce.kd = boardConfig.dce_kd;
    motor.config.ctrlParams.stallProtectSwitch = boardConfig.enableStallProtect;


    /*---------------- Init Motor ----------------*/
    motor.AttachDriver(&tb67H450);
    motor.AttachEncoder(&mt6816);
    motor.controller->Init();
    motor.driver->Init();
    motor.encoder->Init();


//    printf("motor.encoder->IsCalibrated(): %d", motor.encoder->IsCalibrated());



    /*------------- Init peripherals -------------*/
    button1.SetOnEventListener(OnButton1Event);
    button2.SetOnEventListener(OnButton2Event);


    /*------- Start Close-Loop Control Tick ------*/
    HAL_Delay(100);
    HAL_TIM_Base_Start_IT(&htim1);  // 100Hz
    HAL_TIM_Base_Start_IT(&htim4);  // 20kHz


    if (button1.IsPressed())
        encoderCalibrator.isTriggered = true;

    for (;;)
    {

        encoderCalibrator.TickMainLoop();

//        printf("running...\n\r");


        if (boardConfig.configStatus == CONFIG_COMMIT)
        {
            boardConfig.configStatus = CONFIG_OK;
            eeprom.put(0, boardConfig);
        } else if (boardConfig.configStatus == CONFIG_RESTORE)
        {
            eeprom.put(0, boardConfig);
            HAL_NVIC_SystemReset();
        }
    }
}


/* Event Callbacks -----------------------------------------------------------*/
extern "C" void Tim1Callback100Hz()
{
    __HAL_TIM_CLEAR_IT(&htim1, TIM_IT_UPDATE);

    button1.Tick(10);
    button2.Tick(10);
    statusLed.Tick(10, motor.controller->state);

    masterSyncer.Tick(10);
}


extern "C" void Tim4Callback20kHz()
{

    __HAL_TIM_CLEAR_IT(&htim4, TIM_IT_UPDATE);

    if (encoderCalibrator.isTriggered)
        encoderCalibrator.Tick20kHz();
    else
        motor.Tick20kHz();
}


float angles[] = {0, 60, 120, 180, 240, 300, 360};
int idx = 0;
int speed = 18; // 1 ~ 18.
int vel_acc = 40; // 1 ~ 100.
#define REDUCTION_RATIO 30






//
//case 0x05:  // Set Position SetPoint
//
//if (motor.controller->modeRunning != Motor::MODE_COMMAND_POSITION)
//{
//motor.config.motionParams.ratedVelocity = boardConfig.velocityLimit;
//motor.controller->SetCtrlMode(Motor::MODE_COMMAND_POSITION);
//}
//
//motor.controller->SetPositionSetPoint(
//(int32_t) (*(float*) RxData * (float) motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS));

void next_motor_cmd(){


    printf("[next_motor_cmd()] motor.encoder->IsCalibrated(): %d\r\n", motor.encoder->IsCalibrated());

    // first four bytes of RxData[]: _angle / 360.0f * (float) reduction. _angle is in degree.

    float pos;

    if (motor.controller->modeRunning != Motor::MODE_COMMAND_POSITION)
    {
        motor.config.motionParams.ratedVelocity = speed * motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS;
        motor.motionPlanner.positionTracker.SetVelocityAcc(vel_acc * motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS);
        motor.controller->SetCtrlMode(Motor::MODE_COMMAND_POSITION);
    }


    pos = angles[(idx++) % 7] / 360.0f * REDUCTION_RATIO;
    motor.controller->SetPositionSetPoint(
            (int32_t) (pos * (float) motor.MOTOR_ONE_CIRCLE_SUBDIVIDE_STEPS));
}


void OnButton1Event(Button::Event _event)
{
    switch (_event)
    {
        case ButtonBase::UP:
            break;
        case ButtonBase::DOWN:
            break;
        case ButtonBase::LONG_PRESS:

//            encoderCalibrator.isTriggered = true;
            break;

        case ButtonBase::CLICK:

//            HAL_NVIC_SystemReset();

            next_motor_cmd();

            break;
    }
}


void OnButton2Event(Button::Event _event)
{



    switch (_event)
    {
        case ButtonBase::UP:
            break;
        case ButtonBase::DOWN:
            break;
        case ButtonBase::LONG_PRESS:
            switch (motor.controller->modeRunning)
            {
                case Motor::MODE_COMMAND_CURRENT:
                case Motor::MODE_PWM_CURRENT:
                    motor.controller->SetCurrentSetPoint(0);
                    break;
                case Motor::MODE_COMMAND_VELOCITY:
                case Motor::MODE_PWM_VELOCITY:
                    motor.controller->SetVelocitySetPoint(0);
                    break;
                case Motor::MODE_COMMAND_POSITION:
                case Motor::MODE_PWM_POSITION:
                    motor.controller->SetPositionSetPoint(0);
                    break;
                case Motor::MODE_COMMAND_Trajectory:
                case Motor::MODE_STEP_DIR:
                case Motor::MODE_STOP:
                    break;
            }
            break;
        case ButtonBase::CLICK:
            next_motor_cmd();
            break;
    }
}