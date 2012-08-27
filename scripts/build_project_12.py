#!/usr/bin/env python

"""Re-compile and run all tests for the Jack OS.

"""
import os
import subprocess
import glob

ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class_names = [
    'Array',
    'Keyboard',
    'Math',
    'Memory',
    'Output',
    'Screen',
    'String',
    'Sys',
]

tecs_files = os.path.expanduser(os.path.join('~', 'tecs-software-suite-2.5'))
supplied_os_files = glob.glob(os.path.join(tecs_files, 'OS', '*.*'))
jack_compiler = os.path.join(tecs_files, 'JackCompiler.sh')
vm_emulator = os.path.join(tecs_files, 'VMEmulator.sh')


for class_name in class_names:
    path = os.path.join(ROOT, '12', class_name + 'Test')
    test_script = os.path.join(path, class_name + 'Test.tst')
    print(path)
    
    print('Copying OS')
    cp_args = ['cp'] + supplied_os_files
    cp_args.append(path)
    subprocess.call(cp_args)
    
    print('Compiling Jack sources')
    subprocess.call([jack_compiler, path])
    
    if os.path.exists(test_script):
        print('Running tests')
        subprocess.call([vm_emulator, test_script])
    
    else:
        print('Class "%s" requires manual testing.' % class_name)
    
    print('\n')
 