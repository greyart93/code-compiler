interface lang  {
    text: string,
    javascript: string,
    python: string,
    c_cpp: string,
    java: string,
}
const codeSnippets : lang = { 
        text: `Welcome to CodeVit!\nCodeVit is an Online Compiler build to execute code snippets with rich-code editing features\n\nGetting Started\nSelect a Language by clicking the above Dropdown list adjacent to Language\nStart writing your code\nPut Input in Input field (if your code require any input)\nFor multiple inputs e.g.\nname=input()\nage=input()\ngive input as:\n1\n2\ni.e.put each inputs on new line\nclick 'Run Code' button to run the code`,
        javascript: `console.log("ok")`,
        python: `print("python")`,
        c_cpp: `#include <iostream>\nusing namespace std;\n\nint main(){\n  cout << "C++" << endl;\n  return 0;\n}`,
        java: `public class Hi {\n  public static void main(String[] args) {\n      System.out.println("Java");\n       }\n }`
    }

// const x: keyof lang = "JavaScript"
// console.log(codeSnippets[x])

export default codeSnippets;
