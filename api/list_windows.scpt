-- AppleScript Code

set processList to {}
set windowList to ""

tell application "System Events"
	set processList to name of every process whose background only is false
end tell

repeat with appName in processList
	try
		tell application appName
			set windowNames to name of every window
			if (count of windowNames) > 0 then
				set windowList to windowList & "--- " & appName & " ---" & return
				repeat with windowTitle in windowNames
					if windowTitle is not "" then
						set windowList to windowList & "  - " & windowTitle & return
					end if
				end repeat
			end if
		end tell
	end try
end repeat

return windowList