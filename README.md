# 🛡️ Interceptor-Target-Vector Logic (HTML, CSS, JS)

This is a front-end simulation, built entirely using HTML, CSS, and JavaScript. It showcases the logic behind detecting a target, launching an interceptor, and dynamically tracking and colliding with it, all in a visual, browser-based environment.


## 🚀 What It Does

Imagine a hostile drone enters restricted airspace. Our logic simulates:

-  **Detection** of the intruder 
-  **Launch** of an interceptor 
-  **Dynamic tracking** of the target (with changing coordinates)
-  **Collision course** logic to intercept and eliminate

No real hardware or backend is involved. This is purely logic and visualization in action!

##  How It Works

- **HTML** provides the structure of the simulation (canvas, buttons, etc.)
- **CSS** styles the interface and animations
- **JavaScript** handles the logic: movement, tracking, collision detection, coordinate changes, etc.

The logic mimics basic drone AI behavior:
- The intruder drone moves along a predefined or random path.
- The interceptor calculates the real-time position and adjusts its heading.
- When close enough, it "crashes" into the target.
