import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";


export default function AcePage({language, theme, defaultCode, scode, onValueChange}) {
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
           name="editor"
           editorProps={{ $blockScrolling: true }}
           highlightActiveLine
           
         />
    );
}