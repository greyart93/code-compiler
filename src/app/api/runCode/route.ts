// app/api/runCode/route.ts
export async function POST(request: Request) {
    try {
        const { code, language, input } = await request.json();

        if (!code || !language) {
            return new Response(
                JSON.stringify({ error: "code and language are required" }),
                { status: 400 }
            );
        }

        const extractJavaClassName = (src: string) => {
            const match = src.match(/(?:public\s+)?class\s+(\w+)/);
            return match ? match[1] : "Main";
        };

        const languageMap: Record<string, string> = {
            python: "python:latest",
            javascript: "javascript:latest",
            c_cpp: "clang:latest",
            java: "java:latest",
            go: "golang:latest",
            rust: "rust:latest",
            typescript: "typescript:latest",
            php: "php:latest",
            lua: "lua:latest",
            kotlin: "kotlin:latest",
            csharp: "csharp:latest",
            dart: "dart:latest",
            bash: "bash:latest",
            assembly: "assembly:latest",
            swift: "swift:latest",
            ruby: "ruby:latest",
        };

        const langEndpoint = languageMap[language] || "python:latest";
        const javaClassName = language === "java" ? extractJavaClassName(code) : null;

        // File name each language expects
        const getFileName = (): string => {
            switch (language) {
                case "javascript":
                    return "main.js";
                case "typescript":
                    return "main.ts";
                case "php":
                    return "main.php";
                case "csharp":
                    return "main.cs";
                case "lua":
                    return "main.lua";
                case "kotlin":
                    return "main.kt";
                case "dart":
                    return "main.dart";
                case "swift":
                    return "main.swift";
                case "ruby":
                    return "main.rb";
                case "bash":
                    return "main.sh";
                case "assembly":
                    return "main.asm";
                case "c_cpp":
                    return "main.cpp";
                case "java":
                    return `${javaClassName}.java`;
                case "go":
                    return "main.go";
                case "rust":
                    return "main.rs";
                case "python":
                default:
                    return "main.py";
            }
        };

        // Build step(s) needed before running (empty array = no build needed)
        const getBuildCommands = (): string[] => {
            switch (language) {
                case "c_cpp":
                    return ["clang++ -std=c++11 -o a.out main.cpp"];
                case "java":
                    return [`javac ${javaClassName}.java`];
                case "go":
                    return ["go build -o a.out main.go"];
                case "rust":
                    return ["rustc -O -o main main.rs"];
                case "typescript":
                    return ["tsc main.ts"];
                case "kotlin":
                    return ["kotlinc main.kt -include-runtime -d main.jar"];
                case "csharp":
                    return ["mcs main.cs"];
                case "assembly":
                    return ["nasm -f elf64 -o a.o main.asm", "ld -o a.out a.o"];
                case "javascript": [];
                case "python": [];
                case "php": [];
                case "lua": [];
                case "dart": [];
                case "swift": [];
                case "ruby": [];
                case "bash": [];
                default:
                    return [];
            }
        };

        // Command actually used to execute the program
        const getRunCommand = (): string => {
            switch (language) {
                case "javascript":
                    return "node main.js";
                case "typescript":
                    return "node main.js";
                case "php":
                    return "php main.php";
                case "csharp":
                    return "mono main.exe";
                case "lua":
                    return "lua main.lua";
                case "kotlin":
                    return "java -jar main.jar";
                case "dart":
                    return "dart main.dart";
                case "swift":
                    return "swift main.swift";
                case "ruby":
                    return "ruby main.rb";
                case "bash":
                    return "bash main.sh";
                case "assembly":
                    return "./a.out";
                case "c_cpp":
                    return "./a.out";
                case "java":
                    return `java ${javaClassName}`;
                case "go":
                    return "./a.out";
                case "rust":
                    return "./main";
                case "python":
                default:
                    return "python3 main.py";
            }
        };

        const response = await fetch("https://glot.io/api/mux", {
            method: "POST",
            headers: {
                Authorization: process.env.GLOT_API_TOKEN as string,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "run",
                data: {
                    image: `glot/${langEndpoint}`,
                    payload: {
                        runInstructions: {
                            buildCommands: getBuildCommands(),
                            runCommand: getRunCommand(),
                        },
                        files: [
                            {
                                name: getFileName(),
                                content: code || 'print("ok")',
                            },
                        ],
                        stdin: input || null,
                    },
                },
            }),
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("API Error:", error.message || error);
        return new Response(
            JSON.stringify({
                error: "Failed to run code",
                details: error.message || "Unknown error",
            }),
            { status: 500 }
        );
    }
}