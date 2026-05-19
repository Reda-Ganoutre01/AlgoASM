@echo off
REM ============================================================
REM  AlgoASM Build Script
REM  Requirements:
REM    NASM  -> https://nasm.us           (add to PATH)
REM    MinGW -> https://www.mingw-w64.org (add to PATH, use 32-bit)
REM ============================================================
setlocal

echo [1/4] Assembling sort.asm ...
nasm -f win32 sort.asm -o sort.obj
if errorlevel 1 goto fail

echo [2/4] Assembling tree.asm ...
nasm -f win32 tree.asm -o tree.obj
if errorlevel 1 goto fail

echo [3/4] Compiling main.c ...
gcc -c main.c -o main.obj -m32 -O2
if errorlevel 1 goto fail

echo [4/4] Linking ...
gcc main.obj sort.obj tree.obj ^
    -o AlgoASM.exe ^
    -m32 ^
    -luser32 -lgdi32 -lkernel32 -lcomctl32 ^
    -mwindows -s
if errorlevel 1 goto fail

echo.
echo  Build successful!  Run AlgoASM.exe
echo.
AlgoASM.exe
goto end

:fail
echo.
echo  BUILD FAILED  (check NASM + MinGW-w64 are on PATH)
exit /b 1

:end
