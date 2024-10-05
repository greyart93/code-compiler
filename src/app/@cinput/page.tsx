"use client";
import { useCodeStore } from "@/store/code-store";
import { useState } from "react";

const InputPage = () => {
    const {input, updateInput} = useCodeStore();
    const [localInput, setLocalInput] = useState<string | null>();
   
    const handleInputChange = (e: { target: { value: string; }; }) => {
        const newInput = e.target.value;
        console.log("e: ", newInput)
        setLocalInput(newInput)
        updateInput(newInput)
        console.log("zi: ", input)
        console.log("localinput: ", localInput)                

    }


    return (
        <div className="mx-4 bg-green-100 border border-green-400 text-green-700 p-4 rounded">
        <h2 className="font-bold">Input:</h2>
        <textarea  className='w-3/4 min-h-14 outline-none border bg-zinc-300 border-gray-900 h-20'
        style={{scrollbarWidth: "thin"}}
          value={localInput as string} onChange={handleInputChange} />
        </div>
    )
}

export default InputPage;