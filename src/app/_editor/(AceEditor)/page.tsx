"use client";

import { useEffect, useRef } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-jsx";
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
import "ace-builds/src-noconflict/mode-sql";

// 👇 Theme CSS must be imported or Ace silently falls back to its default look
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-dawn";
import "ace-builds/src-noconflict/theme-eclipse";
import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-monokai";

export default function AcePage({language, theme, defaultCode, scode, onValueChange, onRun, height = "300px", fontSize = 14} : {
  language: string,
  theme: string,
  defaultCode: string,
  scode: string,
  onValueChange: (x: string) => void,
  /** Ctrl/⌘+Enter — run without Ace inserting a newline first */
  onRun?: () => void,
  /** CSS height; pass "100%" when the parent gives the editor a definite height */
  height?: string,
  /** Editor font size in px. */
  fontSize?: number
}) {
    // 👇 Keep the latest onRun in a ref: the command below is registered once at
    //    editor load, so calling onRun directly would run the stale mount-time
    //    closure and POST old code/language on Ctrl+Enter.
    const onRunRef = useRef(onRun);
    onRunRef.current = onRun;

    // The editor is sometimes placed in a pane that changes size without a
    // window resize (fullscreen, output drawer), so resize it with its box.
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

    return (
        <AceEditor
        showPrintMargin={false}
         enableLiveAutocompletion
         enableBasicAutocompletion
         fontSize={fontSize}
         setOptions={{ useWorker: false }}
         height={height}
         width="100%"
         showGutter={true}
           mode={language}
           theme={theme}
           // 👇 react-ace's mount does `setValue(defaultValue || value)` — defaultValue
           //    would override the controlled value (lesson code opened via ?code=…
           //    showed the starter until the first re-render). Only fall back to the
           //    starter when there is no value to show yet.
           defaultValue={scode ? undefined : defaultCode}
           value={scode}
           onChange={onValueChange}
           onLoad={(editor) => {
             resizeObserverRef.current?.disconnect();
             if (typeof ResizeObserver !== "undefined") {
               const observer = new ResizeObserver(() => editor.resize());
               observer.observe(editor.container);
               resizeObserverRef.current = observer;
             }
             editor.commands.addCommand({
               name: "codevitRun",
               bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
               exec: () => onRunRef.current?.(),
             });
           }}
           name="editor"
           editorProps={{ $blockScrolling: true }}
           highlightActiveLine
           
         />
    );
}