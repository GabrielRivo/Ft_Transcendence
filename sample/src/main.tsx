import { createElement, Fragment, render, useState, useEffect, useContext, createContext } from 'my-react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function Counter() {
  const [count, setCount] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const theme = useContext(ThemeContext);

  useEffect(() => {
    console.log('Count changed:', count);
    document.title = `Count: ${count}`;
    return () => {
      console.log('Cleanup for count:', count);
    };
  }, [count]);

  useEffect(() => {
    console.log('Name changed:', name);
  }, [name]);

  const themeClasses = theme === 'dark'
    ? 'bg-gray-800 text-white'
    : 'bg-white text-gray-900';

  return (
    <div className={`p-8 rounded-lg shadow-lg ${themeClasses} max-w-md mx-auto`}>
      <h1 className="text-3xl font-bold mb-4">Count: {count}</h1>
      <h2 className="text-xl mb-6">Theme: {theme}</h2>
      <div className="space-x-4 mb-6">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => setCount(count + 1)}
        >
          +1
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          onClick={() => setCount(count - 1)}
        >
          -1
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          onClick={() => setCount(0)}
        >
          Reset
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={name}
          onInput={(e: Event) => setName((e.target as HTMLInputElement).value)}
          placeholder="Votre nom..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>
      {name && (
        <p className="text-lg">
          Bonjour, <span className="font-bold text-blue-500">{name}</span>! 👋
        </p>
      )}
    </div>
  );
}

function InfoPanel() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Mini Test
      </h3>
      <p className="text-gray-600 mb-4">
        Test de (useState, useEffect, useContext)
        et le rendu concurrent !
      </p>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={theme}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Mini Test
            </h1>
            <InfoPanel />
            <button
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
              }`}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              Basculer vers le thème {theme === 'light' ? 'sombre' : 'clair'}
            </button>
          </header>
          <main>
            <Counter />
          </main>
          <footer className="text-center mt-8 text-gray-600">
            <p>Créé avec Amour !!!</p>
          </footer>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

const root = document.getElementById('root');
if (root) {
  render(<App />, root as HTMLElement);
} else {
  console.error('Element root not found!');
}