"use client";
import {SetStateAction, useState } from "react";
// import AceEditor from "react-ace";
import codeSnippets from "./code-snippets";
import AcePage from "./(AceEditor)/page";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-java";
// import "ace-builds/src-noconflict/mode-html";
// import "ace-builds/src-noconflict/mode-mysql";
// import "ace-builds/src-noconflict/mode-kotlin";
// import "ace-builds/src-noconflict/mode-csharp";
// import "ace-builds/src-noconflict/mode-text";

import "ace-builds/src-noconflict/theme-chrome";
// import "ace-builds/src-noconflict/theme-crimson_editor";
// import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-dawn";
import "ace-builds/src-noconflict/theme-eclipse";

import "ace-builds/src-noconflict/theme-cobalt";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-dracula";

// import "ace-builds/src-noconflict/ext-language_tools";
import { useCodeStore } from "@/store/code-store";


const Ace = () => {
  const [language, setLanguage] = useState("text");
  const [theme, setTheme] = useState("monokai");
  const [defaultCode, setDefaultCode] = useState(``)
  const [scode, setCode] = useState(``);
  const { updateCode, updateLanguage} = useCodeStore();
  // const {code} = useCodeStore()


  function onValueChange(newValue: SetStateAction<string>) {
    // console.log("change", newValue);
    setCode(newValue);
    const newCode: string = newValue as string;
    updateCode(newCode)
    // console.log("zcode: ", code)
  }

  function handleLanguageChange(e: { target: { value: SetStateAction<string>; }; }) {
    const l: keyof (typeof codeSnippets )= e.target.value as keyof (typeof codeSnippets); ;
    setLanguage(l);
    setDefaultCode(codeSnippets[l])
    setCode(codeSnippets[l])
    updateCode(codeSnippets[l])
    updateLanguage(l)
    // console.log("l: ", l)
    // console.log(codeSnippets[l])
  }

  function handleThemeChange(e: { target: { value: SetStateAction<string>; }; }) {
    setTheme(e.target.value);
  }

  return (
    <div>
      <label htmlFor="lang" className=" text-sky-400 font-bold">Language: </label>
      <select id="lang" value={language} onChange={handleLanguageChange} className="bg-slate-600 text-zinc-50" >
        <option value="text" disabled>
          Choose a language
        </option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="c_cpp">C++</option>
        <option value="java">Java</option>
      </select>
      <br/>
      <label htmlFor="theme" className="text-sky-400 font-bold">Theme: </label>
      <select value={theme} onChange={handleThemeChange} className="bg-slate-600 text-zinc-50">
        <optgroup label="Light">
          <option value="chrome">Chrome</option>
          <option value="dawn">Dawn</option>
          <option value="eclipse">Eclipse</option>
        </optgroup>

        <optgroup label="Dark">
          <option value="cobalt">Cobalt</option>
          <option value="dracula">Dracula</option>
          <option value="monokai">Monokai</option>
        </optgroup>
      </select>
    
      <AcePage language={language} theme={theme} defaultCode={defaultCode} scode={scode} onValueChange={onValueChange}  />
    </div>
  );
};

export default Ace;

//
