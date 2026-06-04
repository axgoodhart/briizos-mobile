import { useState } from 'react';
import '../App.css';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1 style-id="stylo-50">Vite + React</h1>
      <div style-id="stylo-51" className="card">
        <button style-id="stylo-52" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p style-id="stylo-53">
          Edit <code style-id="stylo-54">src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </>);

}