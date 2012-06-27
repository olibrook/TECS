
// push constant 0    

@0
D=A
@SP
A=M
M=D
@SP
M=M+1

// pop local 0        

@SP
AM=M-1
D=M
@R13
M=D
@R1
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

// label LOOP_START

(LOOP_START)

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

// push local 0

@R1
D=M
@0
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

// pop local 0	   

@SP
AM=M-1
D=M
@R13
M=D
@R1
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

// if-goto LOOP_START 

@SP
AM=M-1
D=M
@LOOP_START
D;JNE

// push local 0

@R1
D=M
@0
A=D+A
D=M
@SP
A=M
M=D
@SP
M=M+1
