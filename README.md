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
- Tetris - increase speed when level goes up.
- Tetris - seed random number generator properly.


Issues:
-------
 - My compiler is sensitive to comment style, the reference is not - reference
   supports '/*' as well as '/**' as comment openings. This is an oversight.


[tecs]: http://www.nand2tetris.org/
