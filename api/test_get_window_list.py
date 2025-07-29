import Quartz
import pathlib

pdfPath = '/Users/dio/Downloads/Context Engineering for AI Agents_ Lessons from Building Manus.pdf';
pdf_file_name = pathlib.Path(pdfPath).name

def get_window_list():
    # Define options for window listing:
    # kCGWindowListOptionOnScreenOnly: Only include windows that are currently visible on screen.
    # kCGWindowListExcludeDesktopElements: Exclude elements like the desktop background and icons.
    options = Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements

    # Get the window information list
    window_list = Quartz.CGWindowListCopyWindowInfo(options, Quartz.kCGNullWindowID)

    windows = []
    for window_info in window_list:
        # Extract relevant information
        owner_name = window_info.get(Quartz.kCGWindowOwnerName, "Unknown Application")
        window_name = window_info.get(Quartz.kCGWindowName, "Untitled Window")
        window_id = window_info.get(Quartz.kCGWindowNumber)
        bounds = window_info.get(Quartz.kCGWindowBounds)

        windows.append({
            "owner_name": owner_name,
            "window_name": window_name,
            "window_id": window_id,
            "bounds": bounds
        })
    return windows

if __name__ == "__main__":
    open_windows = get_window_list()
    for window in open_windows:
        # if pdf_file_name in window['window_name']:
        #     print(f"Found PDF window: {window['owner_name']} - {window['window_name']}")
        print(f"Application: {window['owner_name']}, Window: {window['window_name']}, ID: {window['window_id']}, Bounds: {window['bounds']}")