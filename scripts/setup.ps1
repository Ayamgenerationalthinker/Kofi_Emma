$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$ScriptDir/setup.mjs"
