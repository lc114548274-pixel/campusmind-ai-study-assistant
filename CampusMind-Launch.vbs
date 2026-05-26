Set shell = CreateObject("WScript.Shell")

root = "C:\Users\LICHUANG\Documents\New project\campusmind-ai-study-assistant"
logs = root & "\.run-logs"
backendScript = logs & "\run-backend.bat"
frontendScript = logs & "\run-frontend.bat"

shell.Run "cmd.exe /k call """ & backendScript & """", 1, False
WScript.Sleep 1500
shell.Run "cmd.exe /k call """ & frontendScript & """", 1, False
WScript.Sleep 5000
shell.Run "http://localhost:3000", 1, False
