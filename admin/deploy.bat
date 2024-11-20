@echo off
if exist "..\server\public" (
    rd /s /q "..\server\public"
    mkdir "..\server\public"
) else (
    mkdir "..\server\public"
)
xcopy /s /i /c /e /h /y "build\*" "..\server\public"
rd /s /q "build"