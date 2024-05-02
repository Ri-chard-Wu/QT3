


file(GLOB_RECURSE SOURCES
        "Communication/*.*"
        "Control/*.*"
        "UserApp/*.*"
        "LowLevel/*.*"
        )

set(INCLUDE_DIR 
        "Communication"
        "Control"
        "UserApp"
        "LowLevel"
        )    

# set(SOURCES main.cpp CPPGPIO/cppgpio.cpp)

idf_component_register(SRCS ${SOURCES}
                       INCLUDE_DIRS ${INCLUDE_DIR})
