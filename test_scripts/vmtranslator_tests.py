#!/usr/bin/env python

"""Re-compile and run all tests for the VMTranslator.

"""
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(__file__))

paths_and_args = [
    [os.path.join(ROOT, '07', 'MemoryAccess', 'BasicTest'), ['--skip-init']],
    [os.path.join(ROOT, '07', 'MemoryAccess', 'PointerTest'), ['--skip-init']],
    [os.path.join(ROOT, '07', 'MemoryAccess', 'StaticTest'), ['--skip-init']],
    
    [os.path.join(ROOT, '07', 'StackArithmetic', 'SimpleAdd'), ['--skip-init']],
    [os.path.join(ROOT, '07', 'StackArithmetic', 'StackTest'), ['--skip-init']],
    
    [os.path.join(ROOT, '08', 'ProgramFlow', 'BasicLoop'), ['--skip-init']],
    [os.path.join(ROOT, '08', 'ProgramFlow', 'FibonacciSeries'), ['--skip-init']],
    [os.path.join(ROOT, '08', 'FunctionCalls', 'SimpleFunction'), ['--skip-init']],
        
    [os.path.join(ROOT, '08', 'FunctionCalls', 'FibonacciElement'), []],
    [os.path.join(ROOT, '08', 'FunctionCalls', 'StaticsTest'), []],
]

vm_translator = os.path.join(ROOT, 'node', 'VMTranslator.js')
cpu_emulator = os.path.expanduser(os.path.join('~', 'tecs-software-suite-2.5', 'CPUEmulator.sh'))


for path, args in paths_and_args:
    d = os.path.abspath(path)
    
    print(d)
    
    vm_translator_args = [vm_translator] + args + [d]
    subprocess.call(vm_translator_args)
    
    test_script = os.path.split(d)[-1]
    test_script = os.path.join(d, test_script + '.tst')
    subprocess.call([cpu_emulator, test_script])
