/*
Implementation notes:

Command format
--------------
Each VM command is of the format:

    - 'command' (eg. add)
    - 'command arg' (eg. goto loop), or
    - 'command arg1 arg2' (eg. push local 3)

Commands are seperated from their args by an arbitrary number of
spaces. Comments are '//' to the end of the line.

Data types
----------

- One 16 bit data type which can represent ints, booleans or pointers.
    - True == 0xFFFF (-1)
    - False == 0x0000 (0)

Commands
--------

Arithmetic and logical commands
+++++++++++++++++++++++++++++++


9 stack-based commands are supported, 2 binary, 2 unary. Commands pop
args off the stack and push results onto the stack.

Commands are as follows:

Command     Function        
-------------------------------------
add         x + y
sub         x - y
neg         -y
eq          x == y
gt          x > y
lt          x < y
and         x && y (bitwise)
or          x || y (bitwise)
not         ! y    (butwise)


Memory access commands
++++++++++++++++++++++

- push [segment] [index], pushes the value from the segment[index]
  onto the stack.
- pop [segment] [index], pops the value from the stack and stores it
  in segment[index]

RAM Usage
---------

Addresses       Usage
-------------------------
0-15            16 Virtual registers
16-255          Static variables of all the functions in the VM program
255-2047        Stack
2048-16483      Heap
16384-24575     Memory-mapped IO


Implementation
--------------

Stage I: Stack arithmetic commands: The first version of your VM translator should
implement the nine stack arithmetic and logical commands of the VM language as well
as the “push constant x” command (which, among other things, will help testing the
nine former commands). Note that the latter is the generic push command for the
special case where the first argument is “constant” and the second argument is
some decimal constant.

Stage II: Memory access commands: The next version of your translator should include
a full implementation of the VM language's push and pop commands, handling all eight
memory segments. We suggest breaking this stage into the following sub-stages:

   0. You have already handled the constant segment;
   1. Next, handle the segments local, argument, this, and that;
   2. Next, handle the pointer and temp segments, in particular allowing modification of the bases of the this and that segments;
   3. Finally, handle the static segment.

*/