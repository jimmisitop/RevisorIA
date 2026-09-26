import { useState } from "react";

export default function App() {
  const [prSeleccionado, setPrSeleccionado] = useState('')

  return (
    <div>
      <h1>Elige el PR a analizar con Bob 2.0</h1>
      <p>El PR lo analizará una IA para corroborar que cumpla con los criterios establecidos de seguridad, pruebas y siga la documentación del repositorio</p>

      <h2>Si deseas, puedes escribir el PR directamente: </h2>
      <input></input><br></br>

      <label htmlFor="PR">Selecciona el PR a analizar: </label>
      <select 
        id="pr"
        value={prSeleccionado} 
        onChange={(e) => setPrSeleccionado(e.target.value)}
      >
        <option value=""></option>
        <option value=""></option>
        <option value=""></option>
      </select>
      
      <p>Seleccionaste: {prSeleccionado}</p>
      <button>Analizar</button>
    </div>
  );
}