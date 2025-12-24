import { Sense } from "@ommishra/sense";

function Counter() {
  const [count, setCount] = Sense.useState(0);

  return (
    <div className="relative group p-1">
      <button
        onclick={() => setCount((c: number) => c + 1)}
        className="w-full h-full overflow-hidden bg-card z-0 grayscale group-hover:grayscale-0 transition-all duration-300 p-4 text-2xl font-semibold"
      >
        Count is <span className="font-bold">{count}</span>
      </button>

      <div
        className="absolute -inset-1 border-[1.5px] border-dashed z-10 border-flicker border-accent-foreground/30! pointer-events-none"
        aria-hidden="true"
      />

      <div className="absolute -inset-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4">
          <div className="absolute top-0 left-0 w-2 h-[0.5px] bg-accent-foreground corner-flicker" />
          <div className="absolute top-0 left-0 w-[0.5px] h-2 bg-accent-foreground corner-flicker" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4">
          <div className="absolute top-0 right-0 w-2 h-[0.5px] bg-accent-foreground corner-flicker" />
          <div className="absolute top-0 right-0 w-[0.5px] h-2 bg-accent-foreground corner-flicker" />
        </div>
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4">
          <div className="absolute bottom-0 left-0 w-2 h-[0.5px] bg-accent-foreground corner-flicker" />
          <div className="absolute bottom-0 left-0 w-[0.5px] h-2 bg-accent-foreground corner-flicker" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4">
          <div className="absolute bottom-0 right-0 w-2 h-[0.5px] bg-accent-foreground corner-flicker" />
          <div className="absolute bottom-0 right-0 w-[0.5px] h-2 bg-accent-foreground corner-flicker" />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-10">

        <div className="flex items-center gap-10">
          <a href="https://vitejs.dev" target="_blank">
            <img
              src="/vite.svg"
              alt="Vite logo"
              className="h-20 w-20 transition-transform hover:scale-110"
            />
          </a>

          <a href="https://sense.ommishra.me" target="_blank">
            <img
              src="/sense.svg"
              alt="Sense logo"
              className="h-40 w-40 transition-transform hover:scale-110"
            />
          </a>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight">
          Vite + SenseJS
        </h1>

        <Counter />
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  Sense.render(<App />, root);
}
