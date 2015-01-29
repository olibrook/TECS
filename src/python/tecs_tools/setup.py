from setuptools import setup, find_packages

setup(
    name="tecs_tools",
    version="0.0.1",
    packages=find_packages(),
    install_requires=[
        "pillow",
    ],
    entry_points={
        'console_scripts': [
            'convert_image = tecs_tools.convert_image:main',
        ]
    }
)
