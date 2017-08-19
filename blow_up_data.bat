@ECHO OFF
ECHO blowing up history... are you sure?
pause
cd data\
rmdir /s .git\
git init
git add rankings.txt
ECHO done
pause