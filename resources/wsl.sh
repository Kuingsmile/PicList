#!/bin/sh
# grab the paths
scriptPath="$(dirname -- "$0")/windows10.ps1"
imagePath="$(dirname -- "$1")"
imageName="$(basename -- "$1")"

# run the powershell script
res="$(powershell.exe -noprofile -noninteractive -nologo -sta -executionpolicy unrestricted -file "$(wslpath -w "$scriptPath")" "$(wslpath -w "$imagePath")\\$imageName")"

# Remove the trailing carriage return from PowerShell's CRLF output.
res="${res%"$(printf '\r')"}"

# check whether image exists
if [ "$res" = "no image" ]; then
    printf '%s\n' 'no image'
else
    wslpath -u -a "$res"
fi
