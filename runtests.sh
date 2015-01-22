#!/usr/bin/env sh

HARDWARE_EXCERCISES=(
	src/01/And16.tst
	src/01/And.tst
	src/01/DMux4Way.tst
	src/01/DMux8Way.tst
	src/01/DMux.tst
	src/01/Mux16.tst
	src/01/Mux4Way16.tst
	src/01/Mux8Way16.tst
	src/01/Mux.tst
	src/01/Not16.tst
	src/01/Not.tst
	src/01/Or16.tst
	src/01/Or8Way.tst
	src/01/Or.tst
	src/01/Xor.tst
	src/02/Add16.tst
	src/02/ALU.tst
	src/02/FullAdder.tst
	src/02/HalfAdder.tst
	src/02/Inc16.tst
	src/03/a/Bit.tst
	src/03/a/PC.tst
	src/03/a/RAM64.tst
	src/03/a/RAM8.tst
	src/03/a/Register.tst
	src/03/b/RAM16K.tst
	src/03/b/RAM4K.tst
	src/03/b/RAM512.tst
	src/05/ComputerAdd-external.tst
	src/05/ComputerAdd.tst
	src/05/ComputerMax-external.tst
	src/05/ComputerMax.tst
	src/05/ComputerRect-external.tst
	src/05/ComputerRect.tst
	src/05/CPU-external.tst
	src/05/CPU.tst
)

INTERACTIVE_TESTS=(
	src/05/Memory.tst
)

for test_file in ${HARDWARE_EXCERCISES[@]}; do
	echo $test_file
    ./bin/HardwareSimulator.sh $test_file
    if [[ $? != 0 ]]; then
    	echo "There were failures"
    	exit 1
    fi
done
