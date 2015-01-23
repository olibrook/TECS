#!/usr/bin/env sh


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
#         echo "There were failures"
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
#         echo "There were failures"
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
#         echo "There were failures"
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
#         echo "There were failures"
#         exit 1
#     fi
# done
# echo ""


# echo "--- Project 04 ---"

# ./bin/Assembler.sh src/04/fill/Fill.asm
# echo "WARNING: src/04/fill/Fill.asm requires interactive testing."

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
#         echo "There were failures"
#         exit 1
#     fi
# done
# echo "Warning: src/05/Memory.tst requires interactive testing."
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
# echo "TODO: This is a Jack programming exercsise. Leave until last."
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

# # Note: In order to compile these examples fully you need to have the completed
# # OS files in the source dir. If present it is possible to run the VMTranslator
# # and the Assembler on the provided Jack sources to then run your own low-level
# # machine code directly.

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
# #    ./bin/node src/node/VMTranslator.js "${base_name}"
# #    ./bin/node src/node/Assembler.js "${base_name}"
#     echo "Warning: '${base_name}' requires interactive testing using VMEmulator.sh"
# done
# echo ""


echo "--- Project 12 ---"
EX12=(
    # Memory
    # Array
    Math
    # String
    # Output
    # Screen
    # Keyboard
    # Sys
)
EX12_HAS_TEST=(
    Memory
    Array
    Math
)

# Compiled working implementations are provided. This is
# in part a reverse-engineering exercise.
provided_os_dir=src/12/OS/

for component in ${EX12[@]}; do
    component_dir="src/12/${component}Test/"

    # Clean and copy provided implementations except for
    # the component we are working on.
    rm -f ${component_dir}*.vm
    cp ${provided_os_dir}/*.vm ${component_dir}
    rm ${component_dir}${component}.vm

    # Compile our own implementation to vm code.
    ./bin/JackCompiler.sh ${component_dir}

    if [ $component == Memory ] || [ $component == Array ] || [ $component == Math ] ; then
        ./bin/VMEmulator.sh ${component_dir}${component}Test.tst
    else
        echo "Interactive test"
    fi
done

echo ""
