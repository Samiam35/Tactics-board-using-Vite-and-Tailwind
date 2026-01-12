import { TacticalBoard } from './components/TacticalBoard';
import { Toolbar } from './components/Toolbar';
import { InspectorPanel } from './components/InspectorPanel';

function App() {
    return (
        <div className="w-screen h-screen bg-slate-900 overflow-hidden">
            <TacticalBoard />
            <Toolbar />
            <InspectorPanel />
        </div>
    );
}

export default App;
