

cd .\Utils
python .\webpage2string.py
cd ..

cd .\Firmware\esp32WifiWebpageServer
@REM idf.py set-target esp32
@REM idf.py menuconfig
idf.py build
idf.py -p COM3 flash 
idf.py -p COM3 monitor 
cd ..\..