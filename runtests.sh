#!/usr/bin/env sh

E1=(src/01/*.tst)
E2=(src/02/*.tst)
E3=(src/03/**/*.tst)
HARDWARE_EXCERCISES=( ${E1[@]} ${E2[@]} ${E3[@]})


for test_file in ${HARDWARE_EXCERCISES[@]}; do
	echo $test_file
    ./bin/HardwareSimulator.sh $test_file
    if [[ $? != 0 ]]; then
    	echo "There were failures"
    	exit 1
    fi
done
