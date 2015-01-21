// This file is part of the materials accompanying the book 
// "The Elements of Computing Systems" by Nisan and Schocken, 
// MIT Press. Book site: www.idc.ac.il/tecs
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input. 
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel. When no key is pressed, 
// the screen should be cleared.

@old_fill       // 1 for filled, 0 for unfilled
M = 0

(POLL)
    @24576              // D holds keypress
    D = M
    
    @KEY_PRESSED        // If key pressed, jump to KEY_PRESSED
    D; JGT
    
    @NO_KEY_PRESSED     // Else jump to NO_KEY_PRESSED
    0; JEQ
    
(KEY_PRESSED)
    @R1
    M = 0
    M = !M              // All ones
    
    @CONT
    0; JEQ

(NO_KEY_PRESSED)
    @R1
    M = 0
    
    @CONT
    0; JEQ


(CONT)              // If newfill != current fill, DRAW, else POLL.
    @old_fill
    D = M
    
    @R1
    D = D - M       // Calculate difference between old fill and current fill.
    
    @DRAW
    D; JNE          // If the fill value changed, DRAW.
    
    @POLL           // Otherwise keep polling.
    0; JMP
    
    
(DRAW)
    @R1             // Save the new fill value to @old_fill
    D = M
    @old_fill
    M = D
    
    // Fill the entire screen with ones or zeros (we have 8192 words to fill
    // in memory)
    
    @R2             // Initialize R2 for use as a counter
    M = 0
    
(DRAW_LOOP)
    @8192           // Check loop bounds to begin
    D = A
    
    @R2
    D = D - M       // D contains screen_size - index
    
    @POLL           // Once D == 0, get back to polling
    D; JEQ
    
    @R2
    D = M           // Load current index into D
    
    @SCREEN
    D = A + D       // Calculate an address on the screen using the counter as an offset.
    
    @R3             // Temp storage for the address on the screen
    M = D
    
    @R1             // Load the new fill value stored in R1
    D = M
    
    @R3             // Reload the memory address stored in R3 into A
    A = M
    
    M = D           // Set the pixels
    
    @R2             // Increment the counter
    M = M + 1
    
    @DRAW_LOOP      // Continue draw loop
    0; JMP