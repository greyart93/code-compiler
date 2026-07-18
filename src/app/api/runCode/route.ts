// app/api/runCode/route.ts
export async function POST(request: Request) {
    try {
        const { code, language, input } = await request.json();

        const extractJavaClassName = (code: string) => {
            const classNameMatch = code.match(/class\s+(\w+)\s*\{/);
            return classNameMatch ? classNameMatch[1] : 'Main';
        };

        const languageMap: Record<string, string> = {
            python: "python/latest",
            javascript: "javascript/latest",
            c_cpp: "cpp/latest",
            java: "java/latest",
        };

        const langEndpoint = languageMap[language] || "python/latest";
        let fileJava = '';
        if (langEndpoint.startsWith("java")) {
            fileJava = extractJavaClassName(code);
        }

        const getFileName = () => {
            switch (language) {
                case 'javascript': return 'index.js';
                case 'c_cpp': return 'main.cpp';
                case 'java': return `${fileJava}.java`;
                case 'python':
                default: return 'main.py';
            }
        };

        // ✅ Using native fetch (Node.js 18+)
        const response = await fetch(`https://glot.io/api/run/${langEndpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': '50e1f336-563c-47ad-99bf-a64ce766385c',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: [
                    {
                        name: getFileName(),
                        content: code || 'print("ok")',
                    },
                ],
                stdin: input || '',
            }),
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("API Error:", error.message || error);
        return new Response(
            JSON.stringify({ 
                error: 'Failed to run code', 
                details: error.message || 'Unknown error' 
            }),
            { status: 500 }
        );
    }
}