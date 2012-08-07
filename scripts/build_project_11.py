#!/usr/bin/env python

"""Re-compile and run all tests for the VMTranslator.

"""
import os
import subprocess
import glob

ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

paths = glob.glob(os.path.join(ROOT, '11', '*'))

jackanalyzer = os.path.join(ROOT, 'node', 'jackanalyzer.js')
vm_translator = os.path.join(ROOT, 'node', 'VMTranslator.js')

os_files = glob.glob(os.path.expanduser(os.path.join('~', 'tecs-software-suite-2.5', 'OS', '*.*')))

for path in paths:
    
    print(path)
    
    print('Copying OS')
    cp_args = ['cp'] + os_files
    cp_args.append(path)
    subprocess.call(cp_args)
    
    print('Compiling Jack sources')
    subprocess.call([jackanalyzer, path])
    
    print('Compiling VM sources')
    subprocess.call([vm_translator, path])
    print('\n')
