The Elements of Computing Systems
=================================

My work on the exercises set in the [The Elements of Computing Systems][tecs]
book.

All the exercises are complete. There's a script which will run all of the
(non-interactive) tests and finally build a version of Tetris with the
compiler which is developed as part of the course.

Fun facts:

- My compiler is written in node.js.
- My version of Tetris has dazzling graphics, inspired by the gameboy classic.

![Tetris](https://raw.githubusercontent.com/olibrook/TECS/master/tetris-screnshot.png)

Requirements
------------

- Python (2.7.6 tested)
- Java (1.7.0_55 tested)

Setup
-----

Bootstrap the project using Buildout. Yeah, yeah - it's what I know and there's
a simple recipe to install node.js:

```
    # Fetch tecs software and node dependencies
    python2.7 bootstrap.py
    ./bin/buildout
```

Running
-------

This will run all tests and build a version of Tetris with
the compiler and OS built as part of the project:

```
    ./runtests.sh
```

Follow the instructions on-screen to run the game.

Issues:
-------
 - My compiler is sensitive to comment style, the reference is not. The
   reference compiler supports `/*` as well as `/**` as comment openings.
   This is an oversight.
 - My compiler doesn't warn when there is an argument name which is shadowed by
   a function local. This produces errors which are extremely hard to debug.
 - Compiling Tetris down to assembly results in a file which is too large for
   the ROM. The VMEmulator doesn't care though (it runs bytecode) and this
   could be fixed by dropping the fancy gameboy graphics and rendering in, say,
   ascii.

[tecs]: http://www.nand2tetris.org/
