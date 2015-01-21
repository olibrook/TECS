// This file is part of the materials accompanying the book 
// "The Elements of Computing Systems" by Nisan and Schocken, 
// MIT Press. Book site: www.idc.ac.il/tecs
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[3], respectively.)


                // Init and reset variables

    @count      // Num. iterations = 0
    M = 0
    
    @R2         // Output = 0
    M = 0

(LOOP)
                // Loop housekeeping
                
    @count      // Load the counter
    D = M
    
    @R1         // Check iteration count and store in D
    A = M - D
    D = A
    
    @END
    D; JEQ      // If iteration count == 0, jump to end.
    
    
    
                // The actual addition step
    @R2
    D = M       // D holds running total of addition
    
    @R0
    D = D + M   // Addition step
    
    @R2         // Store running total in R2
    M = D
    
    
    
    @count      // Increment the loop counter
    D = M + 1
    M = D
    
    @LOOP
    0; JEQ

(END)
    @END
    0;JMP