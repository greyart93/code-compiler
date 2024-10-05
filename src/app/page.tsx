import Ace from "./@editor/page";
import InputPage from "./@cinput/page";
import ExecuteCode from "./@output/page";


export default function Home() {
  return (
    <div className="w-full min-h-screen bg-white bg-[radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(252,205,238,.5)_100%)]">
    <div className="flex flex-col gap-5 w-4/5  ">
    <div id="editor" className="m-2">
      <Ace  />
    </div>
     <InputPage />
    {/* <RunCode /> */}
    <ExecuteCode />
   
  
    </div>
    </div>
  );
}
