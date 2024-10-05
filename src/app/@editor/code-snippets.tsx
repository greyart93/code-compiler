interface lang  {
    javascript: string,
    python: string,
    c_cpp: string,
    java: string,
}
const codeSnippets : lang = { 
        javascript: `console.log("ok")`,
        python: `print("python")`,
        c_cpp: `#include <iostream>\nusing namespace std;\n\nint main(){\n  cout << "C++" << endl;\n  return 0;\n}`,
        java: `public class Hi {\n  public static void main(String[] args) {\n      System.out.println("Java");\n       }\n }`
    }

// const x: keyof lang = "JavaScript"
// console.log(codeSnippets[x])

export default codeSnippets;
