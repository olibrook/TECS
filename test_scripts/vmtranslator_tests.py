#!/usr/bin/env python

"""Re-compile and run all tests for the VMTranslator.

"""
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(__file__))

dirs = [
    os.path.join(ROOT, '07', 'MemoryAccess', 'BasicTest'),
    os.path.join(ROOT, '07', 'MemoryAccess', 'PointerTest'),
    os.path.join(ROOT, '07', 'MemoryAccess', 'StaticTest'),
    
    os.path.join(ROOT, '07', 'StackArithmetic', 'SimpleAdd'),
    os.path.join(ROOT, '07', 'StackArithmetic', 'StackTest'),
    
    os.path.join(ROOT, '08', 'FunctionCalls', 'FibonacciElement'),
    os.path.join(ROOT, '08', 'FunctionCalls', 'SimpleFunction'),
    os.path.join(ROOT, '08', 'FunctionCalls', 'StaticsTest'),
    
    os.path.join(ROOT, '08', 'ProgramFlow', 'BasicLoop'),
    os.path.join(ROOT, '08', 'ProgramFlow', 'FibonacciSeries'),
]

for dirname in dirs:
    d = os.path.abspath(dirname)
    print d
    vmtranslator = os.path.join(ROOT, 'node', 'VMTranslator.js')
    subprocess.call([vmtranslator, d])
