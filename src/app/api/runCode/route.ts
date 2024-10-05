// app/api/runCode/route.ts
import axios from "axios";


export async function POST(request: Request) {
    const { code, language, input } = await request.json(); // Expecting code to be sent in the request body

    
// Function to extract class name from Java code
    const extractJavaClassName = () => {
        const classNameMatch = code.match(/class\s+(\w+) {/); // Match "class ClassName"
        // console.log("classMatch: ", classNameMatch)
          return classNameMatch ? classNameMatch[1] : 'Main'; // Default to 'Main' if no class found
};

    // Mapping languages to their respective endpoints
    const languageMap: Record<string, string> = {
        python: "python/latest",
        javascript: "javascript/latest",
        c_cpp: "cpp/latest",
        java: "java/latest",
    };
    let fileJava = '';
    const langEndpoint = languageMap[language] || "python/latest";
    if(langEndpoint.startsWith("java")){
        fileJava = extractJavaClassName();
    }
    // console.log(input)
    const options = {
        method: "POST",
        url: `https://glot.io/api/run/${langEndpoint}`,
        headers: {
            Authorization: "50e1f336-563c-47ad-99bf-a64ce766385c",
            "Content-Type": "application/json",
        },
       
        data: {
            files: [
                {
                    name: (language === 'javascript' ? 'index.js' : (language === 'c_cpp' ? 'main.cpp' : (language === 'python' ? 'main.py' : (language === 'java' ? `${fileJava}.java` : 'py')))),         
                    content: code || `print("ok")`, // Use the retrieved code here
                    
                }, 
            ],
            stdin: input,
            

        },
        
    };

    try {
        const response = await axios(options);
        return new Response(JSON.stringify(response.data), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to run code' }), { status: 500 });
    }
}