import { create } from "zustand";

type forCode = string | null | undefined;
type forInput = string | number | boolean | object | null | undefined
interface CodeConfig {
    code: forCode;
    updateCode: (newCode: forCode) => void;
    output: forCode;
    updateOutput: (newOutput: forCode) => void;
    language: string;
    updateLanguage: (newLang: string) => void;
    input: forInput;
    updateInput: (newInput: forInput) => void;
}

export const useCodeStore = create<CodeConfig>((set) => ({
    code: null,
    updateCode: (newCode) => set(() => ({ code: newCode })) ,
    output: null,
    updateOutput: (newOutput) => set(() => ({output: newOutput})),
    language: 'python',
    updateLanguage: (newLang) => set({ language: newLang}),
    input: null,
    updateInput: (newInput) => set({ input: newInput}),


}));