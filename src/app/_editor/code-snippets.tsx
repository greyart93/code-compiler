import { DEFAULT_SQL_QUERY } from "@/lib/sql-lab";

interface lang {
  text: string;
  javascript: string;
  typescript: string;
  react: string;
  sql: string;
  python: string;
  c_cpp: string;
  java: string;
  go: string;
  rust: string;
  php: string;
  csharp: string;
  lua: string;
  kotlin: string;
  dart: string;
  swift: string;
  ruby: string;
  bash: string;
  assembly: string;
}
const codeSnippets: lang = {
  text: `Welcome to CodeVit!\nCodeVit is an Online Compiler build to execute code snippets with rich-code editing features\n\nGetting Started\nSelect a Language by clicking the above Dropdown list adjacent to Language\nStart writing your code\nPut Input in Input field (if your code require any input)\nFor multiple inputs e.g.\nname=input()\nage=input()\ngive input as:\n1\n2\ni.e.put each inputs on new line\nclick 'Run Code' button to run the code`,
  javascript: `console.log("ok")`,
  typescript: `const greet = (name: string): string => \`Hello, \${name}!\`;\n\nconsole.log(greet("TypeScript"));`,
  react: `function Counter() {\n  const [count, setCount] = React.useState(0);\n\n  return (\n    <button onClick={() => setCount((n) => n + 1)}>\n      Count is {count}\n    </button>\n  );\n}\n\n<Counter />`,
  sql: DEFAULT_SQL_QUERY,
  python: `print("python")`,
  c_cpp: `#include <iostream>\nusing namespace std;\n\nint main(){\n  cout << "C++" << endl;\n  return 0;\n}`,
  java: `public class Hi {\n  public static void main(String[] args) {\n      System.out.println("Java");\n       }\n }`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Go")\n}`,
  rust: `fn main() {\n  println!("Rust");\n}`,
  php: `<?php\necho "PHP\\n";\n$name = "World";\necho "Hello, $name!";`,
  csharp: `using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("C#");\n  }\n}`,
  lua: `print("Lua")\nfor i = 1, 3 do\n  print("i = " .. i)\nend`,
  kotlin: `fun main() {\n    println("Kotlin")\n    val items = listOf(1, 2, 3)\n    items.forEach { println("item $it") }\n}`,
  dart: `void main() {\n  print('Dart');\n  for (var i = 0; i < 3; i++) {\n    print('i = $i');\n  }\n}`,
  swift: `print("Swift")\nfor i in 1...3 {\n    print("i = \\(i)")\n}`,
  ruby: `puts "Ruby"\n3.times do |i|\n  puts "i = #{i}"\nend`,
  bash: `#!/bin/bash\necho "Bash"\nfor i in 1 2 3; do\n  echo "i = $i"\ndone`,
  assembly: `global _start\n\nsection .data\n    msg db "Assembly!", 10\n    len equ $ - msg\n\nsection .text\n_start:\n    mov rax, 1          ; sys_write\n    mov rdi, 1          ; stdout\n    mov rsi, msg\n    mov rdx, len\n    syscall\n\n    mov rax, 60         ; sys_exit\n    xor rdi, rdi\n    syscall`,
};

export default codeSnippets;
