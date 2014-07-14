#!/bin/bash
echo $0: Creating virtual environment
virtualenv --prompt="<menu_env>" ../menu_env

mkdir ../menu_logs
mkdir ../menu_pids
mkdir ../menu_static/static
mkdir ../menu_static/media

echo $0: Installing dependencies
source ../menu_env/bin/activate
export PIP_REQUIRE_VIRTUALENV=true
../menu_env/bin/pip install --requirement=./requirements.conf --log=./menu_logs/build_pip_packages.log

echo $0: Making virtual environment relocatable
virtualenv --relocatable ../menu_env

echo $0: Creating virtual environment finished.