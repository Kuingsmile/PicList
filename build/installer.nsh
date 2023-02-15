!macro customInstall
   SetRegView 64
   WriteRegStr HKCR "*\shell\PicList" "" "Upload pictures w&ith PicList"
   WriteRegStr HKCR "*\shell\PicList" "Icon" "$INSTDIR\PicList.exe"
   WriteRegStr HKCR "*\shell\PicList\command" "" '"$INSTDIR\PicList.exe" "upload" "%1"'
   SetRegView 32
   WriteRegStr HKCR "*\shell\PicList" "" "Upload pictures w&ith PicList"
   WriteRegStr HKCR "*\shell\PicList" "Icon" "$INSTDIR\PicList.exe"
   WriteRegStr HKCR "*\shell\PicList\command" "" '"$INSTDIR\PicList.exe" "upload" "%1"'
!macroend
!macro customUninstall
   DeleteRegKey HKCR "*\shell\PicList"
!macroend
