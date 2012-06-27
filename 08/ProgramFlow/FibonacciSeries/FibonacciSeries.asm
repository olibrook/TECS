
// push argument 1

@R2
D=M
@1
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1

// pop pointer 1           

@SP
AM=M-1
D=M
@4
M=D

// push constant 0

@0
D=A
@SP
A=M
M=D
@SP
M=M+1

// pop that 0              

@SP
AM=M-1
D=M
@R13
M=D
@R4
D=M
@0
D=D+A
@R14
M=D
@R13
D=M
@R14
A=M
M=D

// push constant 1

@1
D=A
@SP
A=M
M=D
@SP
M=M+1

// pop that 1              

@SP
AM=M-1
D=M
@R13
M=D
@R4
D=M
@1
D=D+A
@R14
M=D
@R13
D=M
@R14
A=M
M=D

// push argument 0

@R2
D=M
@0
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1

// push constant 2

@2
D=A
@SP
A=M
M=D
@SP
M=M+1

// sub

@SP
AM=M-1
D=M
@SP
AM=M-1
M=M-D
@SP
M=M+1

// pop argument 0          

@SP
AM=M-1
D=M
@R13
M=D
@R2
D=M
@0
D=D+A
@R14
M=D
@R13
D=M
@R14
A=M
M=D

// label MAIN_LOOP_START

(MAIN_LOOP_START)

// push argument 0

@R2
D=M
@0
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1

// if-goto COMPUTE_ELEMENT 

@SP
AM=M-1
D=M
@COMPUTE_ELEMENT
D;JNE

// goto END_PROGRAM        

@END_PROGRAM
0;JEQ

// label COMPUTE_ELEMENT

(COMPUTE_ELEMENT)

// push that 0

@R4
D=M
@0
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1

// push that 1

@R4
D=M
@1
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1

// add

@SP
AM=M-1
D=M
@SP
AM=M-1
M=D+M
@SP
M=M+1

// pop that 2              

@SP
AM=M-1
D=M
@R13
M=D
@R4
D=M
@2
D=D+A
@R14
M=D
@R13
D=M
@R14
A=M
M=D

// push pointer 1

@4
D=M
@SP
A=M
M=D
@SP
M=M+1

// push constant 1

@1
D=A
@SP
A=M
M=D
@SP
M=M+1

// add

@SP
AM=M-1
D=M
@SP
AM=M-1
M=D+M
@SP
M=M+1

// pop pointer 1           

@SP
AM=M-1
D=M
@4
M=D

// push argument 0

@R2
D=M
@0
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1

// push constant 1

@1
D=A
@SP
A=M
M=D
@SP
M=M+1

// sub

@SP
AM=M-1
D=M
@SP
AM=M-1
M=M-D
@SP
M=M+1

// pop argument 0          

@SP
AM=M-1
D=M
@R13
M=D
@R2
D=M
@0
D=D+A
@R14
M=D
@R13
D=M
@R14
A=M
M=D

// goto MAIN_LOOP_START

@MAIN_LOOP_START
0;JEQ

// label END_PROGRAM

(END_PROGRAM)
