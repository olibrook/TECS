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

// function Class1.set 0

(Class1.set)

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

// pop static 0

@SP
AM=M-1
D=M
@Class1.0
M=D

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

// pop static 1

@SP
AM=M-1
D=M
@Class1.1
M=D

// push constant 0

@0
D=A
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

// function Class1.get 0

(Class1.get)

// push static 0

@Class1.0
D=M
@SP
A=M
M=D
@SP
M=M+1

// push static 1

@Class1.1
D=M
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

// function Class2.set 0

(Class2.set)

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

// pop static 0

@SP
AM=M-1
D=M
@Class2.0
M=D

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

// pop static 1

@SP
AM=M-1
D=M
@Class2.1
M=D

// push constant 0

@0
D=A
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

// function Class2.get 0

(Class2.get)

// push static 0

@Class2.0
D=M
@SP
A=M
M=D
@SP
M=M+1

// push static 1

@Class2.1
D=M
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

// push constant 6

@6
D=A
@SP
A=M
M=D
@SP
M=M+1

// push constant 8

@8
D=A
@SP
A=M
M=D
@SP
M=M+1

// call Class1.set 2

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
@2
D=D-A
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@Class1.set
0;JEQ
(return-1)

// pop temp 0 

@SP
AM=M-1
D=M
@5
M=D

// push constant 23

@23
D=A
@SP
A=M
M=D
@SP
M=M+1

// push constant 15

@15
D=A
@SP
A=M
M=D
@SP
M=M+1

// call Class2.set 2

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
@2
D=D-A
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@Class2.set
0;JEQ
(return-2)

// pop temp 0 

@SP
AM=M-1
D=M
@5
M=D

// call Class1.get 0

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
@Class1.get
0;JEQ
(return-3)

// call Class2.get 0

@return-4
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
@Class2.get
0;JEQ
(return-4)

// label WHILE

(WHILE)

// goto WHILE

@WHILE
0;JEQ
