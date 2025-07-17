import "./App.css";
import "./tweakcn/app/globals.css";
import ThemeControlPanel from "./tweakcn/components/editor/theme-control-panel";
import ThemePreviewPanel from "./tweakcn/components/editor/theme-preview-panel";
import { useEditorStore } from "./tweakcn/store/editor-store";
import { useTheme } from "./tweakcn/components/theme-provider";
import { CustomScrollbar } from "./components/CustomScrollbar";
import { ThemeStyles } from "./tweakcn/types/theme";

function App() {
  const { themeState, setThemeState } = useEditorStore();
  const { theme } = useTheme();

  return (
    <div className="main-content w-full flex flex-row justify-center text-center overflow-hidden">
      <div className="w-1/3">
        <CustomScrollbar style={{ height: '100%' }}>
          <ThemeControlPanel
            styles={themeState.styles}
            currentMode={theme}
            onChange={(newStyles: ThemeStyles) => {
              setThemeState({ ...themeState, styles: newStyles });
            }}
            themePromise={Promise.resolve(null)}
          />
        </CustomScrollbar>
      </div>
      <div className="w-2/3">
        <CustomScrollbar style={{ height: '100%' }}>
          <ThemePreviewPanel styles={themeState.styles} currentMode={theme} />
        </CustomScrollbar>
      </div>
    </div>
  );
}

export default App;
