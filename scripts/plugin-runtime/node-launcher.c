// Forward node.exe invocations to the application's embedded Node runtime.
// Keep the original command line so spaces, Unicode and quoted script arguments survive.
#define UNICODE
#define _UNICODE
#include <windows.h>
#include <wchar.h>
#include <stdlib.h>
#include <stdio.h>

int wmain(void) {
  wchar_t executable[32768];
  DWORD length = GetEnvironmentVariableW(L"PICLIST_NODE_EXEC_PATH", executable, 32768);
  if (!length || length >= 32768) {
    fputs("PicList's bundled Node launcher is unavailable.\n", stderr);
    return 1;
  }
  const wchar_t *args = GetCommandLineW();
  if (*args == L'"') {
    args++;
    while (*args && *args != L'"') args++;
    if (*args) args++;
  } else {
    while (*args && *args != L' ' && *args != L'\t') args++;
  }
  while (*args == L' ' || *args == L'\t') args++;
  size_t size = wcslen(executable) + wcslen(args) + 5;
  wchar_t *command = (wchar_t *)calloc(size, sizeof(wchar_t));
  if (!command) return 1;
  swprintf_s(command, size, L"\"%s\" %s", executable, args);
  SetEnvironmentVariableW(L"ELECTRON_RUN_AS_NODE", L"1");
  STARTUPINFOW startup = {0};
  PROCESS_INFORMATION child = {0};
  startup.cb = sizeof(startup);
  startup.dwFlags = STARTF_USESTDHANDLES;
  startup.hStdInput = GetStdHandle(STD_INPUT_HANDLE);
  startup.hStdOutput = GetStdHandle(STD_OUTPUT_HANDLE);
  startup.hStdError = GetStdHandle(STD_ERROR_HANDLE);
  SetHandleInformation(startup.hStdInput, HANDLE_FLAG_INHERIT, HANDLE_FLAG_INHERIT);
  SetHandleInformation(startup.hStdOutput, HANDLE_FLAG_INHERIT, HANDLE_FLAG_INHERIT);
  SetHandleInformation(startup.hStdError, HANDLE_FLAG_INHERIT, HANDLE_FLAG_INHERIT);
  BOOL started = CreateProcessW(executable, command, NULL, NULL, TRUE, CREATE_NO_WINDOW, NULL, NULL, &startup, &child);
  free(command);
  if (!started) {
    fprintf(stderr, "Could not start PicList's bundled Node runtime (%lu).\n", GetLastError());
    return 1;
  }
  WaitForSingleObject(child.hProcess, INFINITE);
  DWORD code = 1;
  GetExitCodeProcess(child.hProcess, &code);
  CloseHandle(child.hThread);
  CloseHandle(child.hProcess);
  return (int)code;
}
