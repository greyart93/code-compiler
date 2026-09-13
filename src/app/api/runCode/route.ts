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
        };

        const langEndpoint = languageMap[language] || "python:latest";
        const javaClassName = language === "java" ? extractJavaClassName(code) : null;

        // File name each language expects
        const getFileName = (): string => {
            switch (language) {
                case "javascript":
                    return "main.js";
                case "c_cpp":
                    return "main.cpp";
                case "java":
                    return `${javaClassName}.java`;
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
                case "javascript":
                case "python":
                default:
                    return [];
            }
        };

        // Command actually used to execute the program
        const getRunCommand = (): string => {
            switch (language) {
                case "javascript":
                    return "node main.js";
                case "c_cpp":
                    return "./a.out";
                case "java":
                    return `java ${javaClassName}`;
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