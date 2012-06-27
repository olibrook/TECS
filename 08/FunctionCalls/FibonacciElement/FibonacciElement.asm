@256
D=A
@SP
M=D
@return-0
D=A
@SP
A=M
M=D
@SP
M=M+1
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
@SP
D=M
@0
D=D-A
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@Sys.init
0;JEQ
(return-0)

// function Main.fibonacci 0

(Main.fibonacci)

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

// lt                     

@SP
AM=M-1
D=M
@SP
AM=M-1
D=D-M
@IF_LT_0
D;JGT
@SP
A=M
M=0
@LT_END_0
0;JMP
(IF_LT_0)
@SP
A=M
M=-1
(LT_END_0)
@SP
M=M+1

// if-goto IF_TRUE

@SP
AM=M-1
D=M
@IF_TRUE
D;JNE

// goto IF_FALSE

@IF_FALSE
0;JEQ

// label IF_TRUE          

(IF_TRUE)

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

// return

@LCL
D=M
@R13
M=D
@5
A=D-A
D=M
@R14
M=D
@SP
AM=M-1
D=M
@ARG
A=M
M=D
@ARG
A=M+1
D=A
@SP
M=D
@R13
D=M
@1
A=D-A
D=M
@THAT
M=D
@R13
D=M
@2
A=D-A
D=M
@THIS
M=D
@R13
D=M
@3
A=D-A
D=M
@ARG
M=D
@R13
D=M
@4
A=D-A
D=M
@LCL
M=D
@R14
A=M
0;JEQ

// label IF_FALSE         

(IF_FALSE)

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

// call Main.fibonacci 1  

@return-1
D=A
@SP
A=M
M=D
@SP
M=M+1
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
@SP
D=M
@1
D=D-A
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@Main.fibonacci
0;JEQ
(return-1)

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

// call Main.fibonacci 1  

@return-2
D=A
@SP
A=M
M=D
@SP
M=M+1
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
@SP
D=M
@1
D=D-A
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@Main.fibonacci
0;JEQ
(return-2)

// add                    

@SP
AM=M-1
D=M
@SP
AM=M-1
M=D+M
@SP
M=M+1

// return

@LCL
D=M
@R13
M=D
@5
A=D-A
D=M
@R14
M=D
@SP
AM=M-1
D=M
@ARG
A=M
M=D
@ARG
A=M+1
D=A
@SP
M=D
@R13
D=M
@1
A=D-A
D=M
@THAT
M=D
@R13
D=M
@2
A=D-A
D=M
@THIS
M=D
@R13
D=M
@3
A=D-A
D=M
@ARG
M=D
@R13
D=M
@4
A=D-A
D=M
@LCL
M=D
@R14
A=M
0;JEQ

// function Sys.init 0

(Sys.init)

// push constant 4

@4
D=A
@SP
A=M
M=D
@SP
M=M+1

// call Main.fibonacci 1   

@return-3
D=A
@SP
A=M
M=D
@SP
M=M+1
@LCL
D=M
@SP
A=M
M=D
@SP
M=M+1
@ARG
D=M
@SP
A=M
M=D
@SP
M=M+1
@THIS
D=M
@SP
A=M
M=D
@SP
M=M+1
@THAT
D=M
@SP
A=M
M=D
@SP
M=M+1
@SP
D=M
@1
D=D-A
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@Main.fibonacci
0;JEQ
(return-3)

// label WHILE

(WHILE)

// goto WHILE              

@WHILE
0;JEQ
