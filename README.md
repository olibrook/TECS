The Elements of Computing Systems
=================================

My work on the exercises set in the [The Elements of Computing Systems][tecs]
book.

Requirements
------------

- Python (2.7.6 tested)
- Java (1.7.0_55 tested)

Setup
-----

```
    # Fetch tecs software and node dependencies
    python2.7 bootstrap.py
    ./bin/buildout
```

Running
-------

This will run all tests and build a version of pong with
the compiler and OS built as part of the project:

```
    ./runtests.sh
```

Follow the instructions on-screen to run the pong game.


Issues:
-------
 - My compiler is sensitive to comment style, the reference is not - reference
   supports '/*' as well as '/**' as comment openings. This is an oversight.
 - My compiler doesn't warn when there is an argument name which is shadowed by
   a function local. This produces errors which are extremely hard to debug!
 - Compiling tetris down to assembly results in a file which is too large for
   the ROM. The VMEmulator doesn't care though (it runs bytecode) and this
   could be fixed by dropping the fancy graphics on the title screen.

[tecs]: http://www.nand2tetris.org/
