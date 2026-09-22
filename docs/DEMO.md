# Demo Runbook

1. Start the application with `./start.sh`, then open `http://127.0.0.1:5173`.
2. Begin in `DEMO`. The timeline begins with a coarse empty scene.
3. At about three seconds, select `PERSON #17`. The camera overlay, SmartFocus explanation, and dense amber virtual grid all point to the same high-priority object.
4. At about nine seconds, a car enters with fine detail. At about fifteen seconds, a static far chair retains coarse detail; at about eighteen seconds, a backpack receives medium contextual detail.
5. Inspect the **Virtual Radial Grid Engine** panel. It compares the declared uniform 5 cm-equivalent baseline against the calculated adaptive allocation, then exposes every radial/focus band used in the result.
6. Open `PERFORMANCE` to contrast uniform and adaptive allocation. Demo does not claim FPS or inference latency; its cell/storage reduction is labeled as a virtual-grid calculation.
7. Choose `LIVE AI`, grant the terminal camera permission in macOS if prompted, and show objects to the MacBook camera. The UI reports the active local detector capability.
7. If camera permission or inference is unavailable, return to `DEMO`; the visual story remains stable.
