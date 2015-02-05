#!/usr/bin/env bash

function _msg(){
    local exp=$1;
    local color=$2;
    if ! [[ $color =~ '^[0-9]$' ]] ; then
       case $(echo $color | tr '[:upper:]' '[:lower:]') in
        black) color=0 ;;
        red) color=1 ;;
        green) color=2 ;;
        yellow) color=3 ;;
        blue) color=4 ;;
        magenta) color=5 ;;
        cyan) color=6 ;;
        white|*) color=7 ;; # white or invalid color
       esac
    fi
    tput setaf $color;
    echo $exp;
    tput sgr0;
}


# echo "--- Project 00 ---"
# EX00=(
#     src/00/And.tst
#     src/00/Mux8Way16.tst
#     src/00/RAM8.tst
#     src/00/Register.tst
# )
# for test_file in ${EX00[@]}; do
#     echo $test_file
#     ./bin/HardwareSimulator.sh $test_file
#     if [[ $? != 0 ]]; then
#         _msg "There were failures" red
#         exit 1
#     fi
# done
# echo ""


# echo "--- Project 01 ---"
# EX01=(
#     src/01/And16.tst
#     src/01/And.tst
#     src/01/DMux4Way.tst
#     src/01/DMux8Way.tst
#     src/01/DMux.tst
#     src/01/Mux16.tst
#     src/01/Mux4Way16.tst
#     src/01/Mux8Way16.tst
#     src/01/Mux.tst
#     src/01/Not16.tst
#     src/01/Not.tst
#     src/01/Or16.tst
#     src/01/Or8Way.tst
#     src/01/Or.tst
#     src/01/Xor.tst
# )
# for test_file in ${EX01[@]}; do
#     echo $test_file
#     ./bin/HardwareSimulator.sh $test_file
#     if [[ $? != 0 ]]; then
#         _msg "There were failures" red
#         exit 1
#     fi
# done
# echo ""


# echo "--- Project 02 ---"
# EX02=(
#     src/02/Add16.tst
#     src/02/ALU.tst
#     src/02/FullAdder.tst
#     src/02/HalfAdder.tst
#     src/02/Inc16.tst
# )
# for test_file in ${EX02[@]}; do
#     echo $test_file
#     ./bin/HardwareSimulator.sh $test_file
#     if [[ $? != 0 ]]; then
#         _msg "There were failures" red
#         exit 1
#     fi
# done
# echo ""


# echo "--- Project 03 ---"
# EX03=(
#     src/03/a/Bit.tst
#     src/03/a/PC.tst
#     src/03/a/RAM64.tst
#     src/03/a/RAM8.tst
#     src/03/a/Register.tst
#     src/03/b/RAM16K.tst
#     src/03/b/RAM4K.tst
#     src/03/b/RAM512.tst
# )
# for test_file in ${EX03[@]}; do
#     echo $test_file
#     ./bin/HardwareSimulator.sh $test_file
#     if [[ $? != 0 ]]; then
#         _msg "There were failures" red
#         exit 1
#     fi
# done
# echo ""


# echo "--- Project 04 ---"

# ./bin/Assembler.sh src/04/fill/Fill.asm
# _msg "WARNING: src/04/fill/Fill.asm requires interactive testing." yellow

# ./bin/Assembler.sh src/04/mult/Mult.asm
# ./bin/CPUEmulator.sh src/04/mult/Mult.tst

# echo ""


# echo "--- Project 05 ---"
# EX05=(
#     src/05/ComputerAdd-external.tst
#     src/05/ComputerAdd.tst
#     src/05/ComputerMax-external.tst
#     src/05/ComputerMax.tst
#     src/05/ComputerRect-external.tst
#     src/05/ComputerRect.tst
#     src/05/CPU-external.tst
#     src/05/CPU.tst
# )
# for test_file in ${EX05[@]}; do
#     echo $test_file
#     ./bin/HardwareSimulator.sh $test_file
#     if [[ $? != 0 ]]; then
#         _msg "There were failures" red
#         exit 1
#     fi
# done
# _msg "WARNING: src/05/Memory.tst requires interactive testing." yellow
# echo ""


# echo "--- Project 06 ---"
# EX06=(
#     src/06/add/Add
#     src/06/max/Max
#     src/06/max/MaxL
#     src/06/pong/Pong
#     src/06/pong/PongL
#     src/06/rect/Rect
#     src/06/rect/RectL
# )
# for base_name in ${EX06[@]}; do
#     ./bin/Assembler.sh "$base_name.asm"
#     ./bin/node src/node/Assembler.js "$base_name.asm" --extension=out
#     ./bin/TextComparer.sh "$base_name.hack" "$base_name.out"
# done
# echo ""


# echo "--- Project 07 ---"
# EX07=(
#     src/07/MemoryAccess/BasicTest/BasicTest
#     src/07/MemoryAccess/PointerTest/PointerTest
#     src/07/MemoryAccess/StaticTest/StaticTest
#     src/07/StackArithmetic/SimpleAdd/SimpleAdd
#     src/07/StackArithmetic/StackTest/StackTest
# )
# for base_name in ${EX07[@]}; do
#     ./bin/node src/node/VMTranslator.js --skip-init "$base_name.vm"
#     ./bin/CPUEmulator.sh "$base_name.tst"
# done

# echo ""


# echo "--- Project 08 ---"

# # Init handled by the test script.
# EX08_NO_INIT=(
#     src/08/ProgramFlow/BasicLoop/BasicLoop
#     src/08/FunctionCalls/SimpleFunction/SimpleFunction
#     src/08/ProgramFlow/FibonacciSeries/FibonacciSeries
# )
# for base_name in ${EX08_NO_INIT[@]}; do
#     ./bin/node src/node/VMTranslator.js --skip-init `dirname $base_name`
#     ./bin/CPUEmulator.sh "$base_name.tst"
# done

# # Init expected to be done by the VMTranslator.
# EX08_INIT_REQUIRED=(
#     src/08/FunctionCalls/FibonacciElement/FibonacciElement
#     src/08/FunctionCalls/StaticsTest/StaticsTest
# )
# for base_name in ${EX08_INIT_REQUIRED[@]}; do
#     ./bin/node src/node/VMTranslator.js `dirname $base_name`
#     ./bin/CPUEmulator.sh "$base_name.tst"
# done

# echo ""


# echo "--- Project 09 ---"

# ./bin/JackCompiler.sh src/09/tetris

# echo ""


# echo "--- Project 10 ---"
# EX10=(
#     src/10/ArrayTest/Main
#     src/10/ExpressionlessSquare/Main
#     src/10/ExpressionlessSquare/Square
#     src/10/ExpressionlessSquare/SquareGame
#     src/10/Square/Main
#     src/10/Square/Square
#     src/10/Square/SquareGame
# )
# for base_name in ${EX10[@]}; do
#     echo $base_name
#     ./bin/node src/node/jackanalyzer.js --mode=tokenize "${base_name}.jack"
#     ./bin/TextComparer.sh "${base_name}T.xml" "${base_name}.jack.tokenized.xml"

#     ./bin/node src/node/jackanalyzer.js --mode=parse "${base_name}.jack"
#     ./bin/TextComparer.sh "${base_name}.xml" "${base_name}.parsed.xml"
# done
# echo ""


# echo "--- Project 11 ---"

# EX11=(
#     src/11/Seven
#     src/11/ConvertToBin
#     src/11/Square
#     src/11/Average
#     src/11/Pong
#     src/11/ComplexArrays
# )
# for base_name in ${EX11[@]}; do
#     ./bin/node src/node/jackanalyzer.js --mode=compile "${base_name}"
#     _msg "WARNING: '${base_name}' requires interactive testing using VMEmulator.sh" yellow
# done
# echo ""


# echo "--- Project 12 ---"
# EX12=(
#     Memory
#     Array
#     Math
#     String
#     Output
#     Screen
#     Keyboard
#     Sys
# )
# EX12_HAS_TEST=(
#     Memory
#     Array
#     Math
# )

# # Compiled working implementations are provided. This is
# # in part a reverse-engineering exercise.
# provided_os_dir=src/12/OS/

# for component in ${EX12[@]}; do
#     component_dir="src/12/${component}Test/"

#     # Clean and copy provided implementations except for
#     # the component we are working on.
#     rm -f ${component_dir}*.vm
#     cp ${provided_os_dir}/*.vm ${component_dir}
#     rm ${component_dir}${component}.vm

#     # Compile our own implementation to vm code.
#     ./bin/JackCompiler.sh ${component_dir}

#     if [ $component == Memory ] || [ $component == Array ] || [ $component == Math ] ; then
#         ./bin/VMEmulator.sh ${component_dir}${component}Test.tst
#     else
#         _msg "WARNING: ${component} requires interactive testing" yellow
#     fi
# done
# echo ""


echo "--- Building Tetris using the home-made OS and compilers ---"

# Cleanup

rm -f src/tetris/*.jack
rm -f src/tetris/*.vm
rm -f src/tetris/*.hack

for component in ${EX12[@]}; do
    cp src/12/${component}Test/${component}.jack src/tetris/
done

cp src/09/tetris/*.jack src/tetris/

./bin/node src/node/jackanalyzer.js src/tetris/
./bin/node src/node/VMTranslator.js src/tetris/
./bin/node src/node/Assembler.js src/tetris/

cat << "EOF"
  _______ ______ _______ _____  _____  _____
 |__   __|  ____|__   __|  __ \|_   _|/ ____|
    | |  | |__     | |  | |__) | | | | (___
    | |  |  __|    | |  |  _  /  | |  \___ \
    | |  | |____   | |  | | \ \ _| |_ ____) |
    |_|__|______|  |_|  |_|  \_\_____|_____/
    / __ \| \ | |
   | |  | |  \| |
   | |  | | . ` |
   | |__| | |\  |
  _ \____/|_| \_| _____ _  __ __      ____  __
 | |  | |   /\   / ____| |/ / \ \    / /  \/  |
 | |__| |  /  \ | |    | ' /   \ \  / /| \  / |
 |  __  | / /\ \| |    |  <     \ \/ / | |\/| |
 | |  | |/ ____ \ |____| . \     \  /  | |  | |
 |_|  |_/_/    \_\_____|_|\_\     \/   |_|  |_|

EOF

_msg "Okay! Run ./bin/VMEmulator.sh and open the src/tetris directory to play." green
_msg "Set 'animate: no animation' and 'speed: fast' in the emulator." green

echo ""
