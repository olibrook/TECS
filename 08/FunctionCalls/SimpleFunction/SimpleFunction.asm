
// function SimpleFunction.test 2

(SimpleFunction.test)                                                           // 0
@SP                                                                             // 1
A=M                                                                             // 2
M=0                                                                             // 3
@SP                                                                             // 4
M=M+1                                                                           // 5
@SP                                                                             // 6
A=M                                                                             // 7
M=0                                                                             // 8
@SP                                                                             // 9
M=M+1                                                                           // 10

// push local 0

@R1                                                                             // 11
D=M                                                                             // 12
@0                                                                              // 13
A=D+A                                                                           // 14
D=M                                                                             // 15
@SP                                                                             // 16
A=M                                                                             // 17
M=D                                                                             // 18
@SP                                                                             // 19
M=M+1                                                                           // 20

// push local 1

@R1                                                                             // 21
D=M                                                                             // 22
@1                                                                              // 23
A=D+A                                                                           // 24
D=M                                                                             // 25
@SP                                                                             // 26
A=M                                                                             // 27
M=D                                                                             // 28
@SP                                                                             // 29
M=M+1                                                                           // 30

// add

@SP                                                                             // 31
AM=M-1                                                                          // 32
D=M                                                                             // 33
@SP                                                                             // 34
AM=M-1                                                                          // 35
M=D+M                                                                           // 36
@SP                                                                             // 37
M=M+1                                                                           // 38

// not

@SP                                                                             // 39
AM=M-1                                                                          // 40
D=M                                                                             // 41
M=!D                                                                            // 42
@SP                                                                             // 43
M=M+1                                                                           // 44

// push argument 0

@R2                                                                             // 45
D=M                                                                             // 46
@0                                                                              // 47
A=D+A                                                                           // 48
D=M                                                                             // 49
@SP                                                                             // 50
A=M                                                                             // 51
M=D                                                                             // 52
@SP                                                                             // 53
M=M+1                                                                           // 54

// add

@SP                                                                             // 55
AM=M-1                                                                          // 56
D=M                                                                             // 57
@SP                                                                             // 58
AM=M-1                                                                          // 59
M=D+M                                                                           // 60
@SP                                                                             // 61
M=M+1                                                                           // 62

// push argument 1

@R2                                                                             // 63
D=M                                                                             // 64
@1                                                                              // 65
A=D+A                                                                           // 66
D=M                                                                             // 67
@SP                                                                             // 68
A=M                                                                             // 69
M=D                                                                             // 70
@SP                                                                             // 71
M=M+1                                                                           // 72

// sub

@SP                                                                             // 73
AM=M-1                                                                          // 74
D=M                                                                             // 75
@SP                                                                             // 76
AM=M-1                                                                          // 77
M=M-D                                                                           // 78
@SP                                                                             // 79
M=M+1                                                                           // 80

// return

@LCL                                                                            // 81
D=M                                                                             // 82
@R13                                                                            // 83
M=D // R13 holds value of LCL (or FRAME)                                        // 84
@5                                                                              // 85
A=D-A // Address of the return address in the frame                             // 86
D=M // Dereference return address                                               // 87
@R14                                                                            // 88
M=D // R14 holds return address                                                 // 89
@SP                                                                             // 90
AM=M-1                                                                          // 91
D=M                                                                             // 92
@ARG // Reposition return value for the caller.                                 // 93
A=M                                                                             // 94
M=D                                                                             // 95
@ARG // Restore SP of the caller                                                // 96
A=M+1                                                                           // 97
D=A                                                                             // 98
@SP                                                                             // 99
M=D                                                                             // 100
@R13 // Restore THAT of the caller                                              // 101
D=M                                                                             // 102
@1                                                                              // 103
A=D-A                                                                           // 104
D=M                                                                             // 105
@THAT                                                                           // 106
M=D                                                                             // 107
@R13 // Restore THIS of the caller                                              // 108
D=M                                                                             // 109
@2                                                                              // 110
A=D-A                                                                           // 111
D=M                                                                             // 112
@THIS                                                                           // 113
M=D                                                                             // 114
@R13 // Restore ARG of the caller                                               // 115
D=M                                                                             // 116
@3                                                                              // 117
A=D-A                                                                           // 118
D=M                                                                             // 119
@ARG                                                                            // 120
M=D                                                                             // 121
@R13 // Restore LCL of the caller                                               // 122
D=M                                                                             // 123
@4                                                                              // 124
A=D-A                                                                           // 125
D=M                                                                             // 126
@LCL                                                                            // 127
M=D                                                                             // 128
@R14 // Jump to return address of caller.                                       // 129
A=M                                                                             // 130
0;JEQ                                                                           // 131
