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

TODOs:
------
- Tetris - center the screen.
- Tetris - display line count.
- Tetris - display score.
- Tetris - increase speed when level goes up.
- Tetris - draw outline of a gameboy around the screen :D.
- Check error codes are correct throughout the OS implementation.
- A proper malloc/deAlloc test would be good. Malloc the entire memory and
  check it can be reclaimed.


Issues:
-------
 - My compiler is sensitive to comment style, the reference is not - reference
   supports '/*' as well as '/**' as comment openings. This is an oversight.


[tecs]: http://www.nand2tetris.org/
