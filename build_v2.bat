@echo off
REM ============================================================
REM  AlgoASM v2.0 Build Script (Enhanced)
REM  Requirements:
REM    NASM  -> https://nasm.us           (add to PATH)
REM    MinGW -> https://www.mingw-w64.org (add to PATH, use 32-bit)
REM ============================================================
setlocal

echo.
echo  ====================================
echo   AlgoASM v2.0 Build System
echo  ====================================
echo.

echo [1/5] Assembling sort_extended.asm ...
nasm -f win32 sort_extended.asm -o sort_extended.obj
if errorlevel 1 goto fail

echo [2/5] Assembling tree_extended.asm ...
nasm -f win32 tree_extended.asm -o tree_extended.obj
if errorlevel 1 goto fail

echo [3/5] Compiling main_enhanced.c ...
gcc -c main_enhanced.c -o main.obj -m32 -O2 -std=c99
if errorlevel 1 goto fail

echo [4/5] Linking executables ...
gcc main.obj sort_extended.obj tree_extended.obj ^
    -o AlgoASM.exe ^
    -m32 ^
    -luser32 -lgdi32 -lkernel32 -lcomctl32 ^
    -mwindows -s
if errorlevel 1 goto fail

echo [5/5] Build complete! 
echo.
echo  ====================================
echo   ✓ BUILD SUCCESSFUL
echo  ====================================
echo.
echo  Running AlgoASM v2.0...
echo.
AlgoASM.exe
goto end

:fail
echo.
echo  ====================================
echo   ✗ BUILD FAILED
echo  ====================================
echo.
echo  Troubleshooting:
echo   - Verify NASM is installed and in PATH
echo   - Verify MinGW-w64 32-bit is installed and in PATH
echo   - Verify all .asm files exist in project directory
echo.
exit /b 1

:end
