import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-rust";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-csharp";
import "ace-builds/src-noconflict/mode-lua";
import "ace-builds/src-noconflict/mode-kotlin";
import "ace-builds/src-noconflict/mode-dart";
import "ace-builds/src-noconflict/mode-swift";
import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/mode-sh";
import "ace-builds/src-noconflict/mode-assembly_x86";

// 👇 Theme CSS must be imported or Ace silently falls back to its default look
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-dawn";
import "ace-builds/src-noconflict/theme-eclipse";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-monokai";

export default function AcePage({language, theme, defaultCode, scode, onValueChange, onRun} : { 
  language: string,
  theme: string,
  defaultCode: string,
  scode: string,
  onValueChange: (x: string) => void,
  /** Ctrl/⌘+Enter — run without Ace inserting a newline first */
  onRun?: () => void
}) {
    return (
        <AceEditor
        showPrintMargin={false}
         enableLiveAutocompletion
         enableBasicAutocompletion
         fontSize={14}
         height="300px"
         width="100%"
         showGutter={true}
           mode={language}
           theme={theme}
           defaultValue={defaultCode}
           value={scode}
           onChange={onValueChange}
           onLoad={(editor) => {
             editor.commands.addCommand({
               name: "codevitRun",
               bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
               exec: () => onRun?.(),
             });
           }}
           name="editor"
           editorProps={{ $blockScrolling: true }}
           highlightActiveLine
           
         />
    );
}