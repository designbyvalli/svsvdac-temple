import React, { createContext, useContext, useState } from 'react';
const C=createContext(null);
export const LanguageProvider=({children})=>{const [lang,setLang]=useState('en');const t=(en,te)=>lang==='te'?te:en;return <C.Provider value={{lang,setLang,t}}>{children}</C.Provider>};
export const useLang=()=>useContext(C);
