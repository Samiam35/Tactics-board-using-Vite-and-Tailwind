import { TacticalBoard } from './components/TacticalBoard';
import { Toolbar } from './components/Toolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { StarryBackground } from './components/StarryBackground';

function App() {
    return (
        <div className="w-screen h-screen bg-black overflow-hidden relative">
            <StarryBackground />
            <div className="relative z-10 w-full h-full">
                <TacticalBoard />
                <Toolbar />
                <InspectorPanel />
            </div>
        </div>
    );
}

export default App;
