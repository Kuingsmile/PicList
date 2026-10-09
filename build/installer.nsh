; Custom hooks for the electron-builder assisted installer.
; electron-builder includes this file before MUI2 and the language tables are
; loaded, so anything that depends on them lives inside the hook macros.

!define PICLIST_MENU_KEY "Software\Classes\SystemFileAssociations\image\shell\PicList"
; Versions up to 3.5.0 wrote the verb for every file type through HKCR.
!define PICLIST_LEGACY_MENU_KEY "Software\Classes\*\shell\PicList"

!ifndef BUILD_UNINSTALLER
  Var piclistContextMenu
  Var piclistContextMenuCheckbox
  Var piclistContextMenuMode
!else
  Var piclistDeleteData
  Var piclistDeleteDataCheckbox
!endif

!if "${APP_PACKAGE_NAME}" == ""
  !error "APP_PACKAGE_NAME is empty; refusing to build an uninstaller that deletes $APPDATA\"
!endif

!macro piclistNotifyShell
  ; SHCNE_ASSOCCHANGED, so Explorer picks up the verb without a restart
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro customHeader
  ; Render crisp text on scaled displays instead of a bitmap-stretched window.
  ManifestDPIAware true

  ; The stock language files ask for Tahoma, SimSun and PMingLiU.
  SetFont /LANG=1033 "Segoe UI" 9
  SetFont /LANG=2052 "Microsoft YaHei UI" 9
  SetFont /LANG=1028 "Microsoft JhengHei UI" 9

  !ifndef BUILD_UNINSTALLER
    LangString piclistTasksTitle 1033 "Additional Tasks"
    LangString piclistTasksTitle 2052 "附加任务"
    LangString piclistTasksTitle 1028 "附加工作"

    LangString piclistTasksSubtitle 1033 "Choose additional tasks to perform while installing ${PRODUCT_NAME}."
    LangString piclistTasksSubtitle 2052 "选择安装 ${PRODUCT_NAME} 时要执行的附加任务。"
    LangString piclistTasksSubtitle 1028 "選擇安裝 ${PRODUCT_NAME} 時要執行的附加工作。"

    LangString piclistTaskContextMenu 1033 "&Add $\"Upload with PicList$\" to image context menus"
    LangString piclistTaskContextMenu 2052 "在图片右键菜单中添加“使用 PicList 上传”(&A)"
    LangString piclistTaskContextMenu 1028 "在圖片右鍵選單中加入「使用 PicList 上傳」(&A)"

    LangString piclistTaskContextMenuHint 1033 "Right-click images to upload them. On Windows 11, use Shift+right-click or $\"Show more options$\" to find this command."
    LangString piclistTaskContextMenuHint 2052 "右键单击图片即可上传。在 Windows 11 中，请按住 Shift 键右键单击图片，或选择“显示更多选项”。"
    LangString piclistTaskContextMenuHint 1028 "以右鍵按一下圖片即可上傳。在 Windows 11 中，請按住 Shift 鍵以右鍵按一下圖片，或選擇「顯示其他選項」。"

    LangString piclistContextMenuVerb 1033 "&Upload with PicList"
    LangString piclistContextMenuVerb 2052 "使用 PicList 上传(&U)"
    LangString piclistContextMenuVerb 1028 "使用 PicList 上傳(&U)"
  !else
    LangString piclistUninstallIntro 1033 "Setup will remove ${PRODUCT_NAME} from your computer.$\r$\n$\r$\nYour settings and data will be kept unless you select the option below."
    LangString piclistUninstallIntro 2052 "安装程序将从您的计算机中移除 ${PRODUCT_NAME}。$\r$\n$\r$\n除非勾选下方选项，否则将保留您的设置和数据。"
    LangString piclistUninstallIntro 1028 "安裝程式將從您的電腦中移除 ${PRODUCT_NAME}。$\r$\n$\r$\n除非勾選下方選項，否則將保留您的設定和資料。"

    LangString piclistDeleteData 1033 "&Delete my PicList settings and data"
    LangString piclistDeleteData 2052 "删除我的 PicList 设置和数据(&D)"
    LangString piclistDeleteData 1028 "刪除我的 PicList 設定和資料(&D)"

    LangString piclistDeleteDataHint 1033 "Removes this Windows account's upload settings, history, plugins and caches. Files stored outside PicList's default folders are kept."
    LangString piclistDeleteDataHint 2052 "将移除当前 Windows 用户的图床配置、上传记录、插件和缓存。存储在 PicList 默认目录之外的文件会被保留。"
    LangString piclistDeleteDataHint 1028 "將移除目前 Windows 使用者的圖床設定、上傳記錄、外掛程式和快取。儲存在 PicList 預設目錄之外的檔案會被保留。"

    Function un.piclistRemoveUserData
      ; Run as the original user when UAC uses a different administrator account.
      SetShellVarContext current
      RMDir /r "$APPDATA\${APP_PACKAGE_NAME}"
      RMDir /r "$LOCALAPPDATA\${APP_PACKAGE_NAME}-updater"
      ; updater cache location used by older versions
      RMDir /r "$LOCALAPPDATA\${APP_PACKAGE_NAME}"
      ; urlImportFiles.ts temp folder
      RMDir /r "$TEMP\${APP_PACKAGE_NAME}Temp"
      ${if} $installMode == "all"
        SetShellVarContext all
      ${endIf}
    FunctionEnd
  !endif
!macroend

!macro customInit
  Call piclistReadContextMenuPreference
!macroend

!macro customUnInit
  StrCpy $piclistDeleteData "0"
  ${if} ${UAC_IsInnerInstance}
    ; Elevation starts a fresh process after the welcome page was completed.
    !insertmacro UAC_AsUser_GetGlobal $piclistDeleteData $piclistDeleteData
  ${endIf}
!macroend

!macro customWelcomePage
  Function piclistReadContextMenuPreference
    ; Reload after changing install scope, but preserve edits when going Back.
    ${if} $piclistContextMenuMode != $installMode
      StrCpy $piclistContextMenuMode $installMode
      ReadRegStr $piclistContextMenu SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" ContextMenu
      ${if} $piclistContextMenu != "0"
        StrCpy $piclistContextMenu "1"
      ${endIf}

      ; Silent and managed deployments can opt out with /NoContextMenu.
      ${GetParameters} $R0
      ClearErrors
      ${GetOptions} $R0 "/NoContextMenu" $R1
      ${ifNot} ${Errors}
        StrCpy $piclistContextMenu "0"
      ${endIf}
      ClearErrors
    ${endIf}
  FunctionEnd

  Function piclistSkipPageIfUpdated
    ${if} ${isUpdated}
    ${orIf} ${UAC_IsInnerInstance}
      Abort
    ${endIf}
  FunctionEnd

  !define MUI_PAGE_CUSTOMFUNCTION_PRE piclistSkipPageIfUpdated
  !insertmacro MUI_PAGE_WELCOME
!macroend

; A plain custom page: the template has already defined
; MUI_PAGE_CUSTOMFUNCTION_PRE for the instfiles page that follows.
!macro customPageAfterChangeDir
  Page custom piclistTasksPageCreate piclistTasksPageLeave

  Function piclistTasksPageCreate
    ${if} ${isUpdated}
      Abort
    ${endIf}

    Call piclistReadContextMenuPreference
    !insertmacro MUI_HEADER_TEXT "$(piclistTasksTitle)" "$(piclistTasksSubtitle)"

    nsDialogs::Create 1018
    Pop $0
    ${if} $0 == error
      Abort
    ${endIf}

    ${NSD_CreateCheckbox} 0 0 100% 24u "$(piclistTaskContextMenu)"
    Pop $piclistContextMenuCheckbox
    ${if} $piclistContextMenu == "1"
      ${NSD_Check} $piclistContextMenuCheckbox
    ${endIf}

    ${NSD_CreateLabel} 10u 28u -10u 40u "$(piclistTaskContextMenuHint)"
    Pop $0

    nsDialogs::Show
  FunctionEnd

  Function piclistTasksPageLeave
    ${NSD_GetState} $piclistContextMenuCheckbox $0
    ${if} $0 == ${BST_CHECKED}
      StrCpy $piclistContextMenu "1"
    ${else}
      StrCpy $piclistContextMenu "0"
    ${endIf}
  FunctionEnd
!macroend

!macro customUnWelcomePage
  !define MUI_PAGE_CUSTOMFUNCTION_PRE un.piclistWelcomePre
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW un.piclistWelcomeShow
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE un.piclistWelcomeLeave
  !insertmacro MUI_UNPAGE_WELCOME

  Function un.piclistWelcomePre
    ${if} ${isUpdated}
    ${orIf} ${UAC_IsInnerInstance}
      Abort
    ${endIf}
  FunctionEnd

  ; Keep layout in dialog units so it follows the selected font and DPI.
  Function un.piclistWelcomeShow
    ShowWindow $mui.WelcomePage.Text ${SW_HIDE}
    ${NSD_CreateLabel} 120u 45u 195u 60u "$(piclistUninstallIntro)"
    Pop $0
    SetCtlColors $0 "${MUI_TEXTCOLOR}" "${MUI_BGCOLOR}"

    ${NSD_CreateCheckbox} 120u 112u 195u 24u "$(piclistDeleteData)"
    Pop $piclistDeleteDataCheckbox
    SetCtlColors $piclistDeleteDataCheckbox "${MUI_TEXTCOLOR}" "${MUI_BGCOLOR}"
    ${if} $piclistDeleteData == "1"
      ${NSD_Check} $piclistDeleteDataCheckbox
    ${endIf}

    ${NSD_CreateLabel} 130u 142u 185u 44u "$(piclistDeleteDataHint)"
    Pop $0
    SetCtlColors $0 "${MUI_TEXTCOLOR}" "${MUI_BGCOLOR}"
  FunctionEnd

  Function un.piclistWelcomeLeave
    ${NSD_GetState} $piclistDeleteDataCheckbox $0
    ${if} $0 == ${BST_CHECKED}
      StrCpy $piclistDeleteData "1"
    ${else}
      StrCpy $piclistDeleteData "0"
    ${endIf}
  FunctionEnd
!macroend

!macro customInstall
  DeleteRegKey SHELL_CONTEXT "${PICLIST_LEGACY_MENU_KEY}"

  ; SHELL_CONTEXT is HKCU for a per-user install and HKLM for all users.
  ${if} $piclistContextMenu == "1"
    WriteRegStr SHELL_CONTEXT "${PICLIST_MENU_KEY}" "" "$(piclistContextMenuVerb)"
    WriteRegStr SHELL_CONTEXT "${PICLIST_MENU_KEY}" "Icon" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}",0'
    ; Raises the legacy verb's selection limit from 15 to 100 images.
    WriteRegStr SHELL_CONTEXT "${PICLIST_MENU_KEY}" "MultiSelectModel" "Player"
    WriteRegStr SHELL_CONTEXT "${PICLIST_MENU_KEY}\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" upload "%1"'
  ${else}
    DeleteRegKey SHELL_CONTEXT "${PICLIST_MENU_KEY}"
  ${endIf}
  WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" ContextMenu "$piclistContextMenu"

  !insertmacro piclistNotifyShell
!macroend

!macro customUnInstall
  ; The installer rewrites the entry right after an update.
  ${ifNot} ${isUpdated}
    DeleteRegKey SHELL_CONTEXT "${PICLIST_MENU_KEY}"
    DeleteRegKey SHELL_CONTEXT "${PICLIST_LEGACY_MENU_KEY}"
    !insertmacro piclistNotifyShell
  ${endIf}

  ; Silent uninstalls can use electron-builder's own --delete-app-data flag.
  ${if} $piclistDeleteData == "1"
  ${andIfNot} ${isUpdated}
    ${if} ${UAC_IsInnerInstance}
      !insertmacro UAC_AsUser_Call Function un.piclistRemoveUserData 0
    ${else}
      Call un.piclistRemoveUserData
    ${endIf}
  ${endIf}
!macroend
