# 🌟 Maze Pathfinder using A* Heuristic Search Algorithm

> **A Complete Python Lab Practical & Interactive Web Visualizer Suite**

![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/Vanilla_CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-00e676?style=for-the-badge)

---

## 📌 Project Overview

This project implements the **A\* (A-Star) Heuristic Search Algorithm** to find the shortest path from a starting coordinate (`S`) to a goal coordinate (`G`) in a 2D maze with obstacle walls (`1`).

It contains two complete components:
1. **`maze_astar.py`**: A beginner-friendly, zero-external-dependency Python script designed for **College Lab Practicals & Submissions**.
2. **Interactive Web Visualizer (`index.html`, `style.css`, `app.js`)**: A cyber-dark glassmorphism web application to interactively draw mazes, step through algorithm evaluations, inspect $f(n) = g(n) + h(n)$ math in real-time, and export custom Python code.

---
# A* Maze Pathfinder

An interactive A* (A-Star) algorithm visualizer and Python lab suite.

## 🚀 Live Demo

👉 [Open A* Maze Pathfinder](https://maze-pathfinder-a.onrender.com/)

## Features

- Visualize the A* pathfinding algorithm
- Create and edit maze walls
- Multiple maze presets
- Adjustable grid dimensions
- Different heuristic functions
- Step-by-step algorithm visualization
- Generate Python code for the current maze

## 🧠 Algorithm

A* uses the formula:

`f(n) = g(n) + h(n)`

Where:
- `g(n)` = cost from the start node
- `h(n)` = estimated cost to the goal
- `f(n)` = total priority score
# A* Maze Pathfinder

An interactive A* (A-Star) algorithm visualizer and Python lab suite.

## 🚀 Live Demo

👉 [Open A* Maze Pathfinder](https://maze-pathfinder-a.onrender.com/)

## Features

- Visualize the A* pathfinding algorithm
- Create and edit maze walls
- Multiple maze presets
- Adjustable grid dimensions
- Different heuristic functions
- Step-by-step algorithm visualization
- Generate Python code for the current maze

## 🧠 Algorithm

A* uses the formula:

`f(n) = g(n) + h(n)`

Where:
- `g(n)` = cost from the start node
- `h(n)` = estimated cost to the goal
- `f(n)` = total priority score


## 🧠 Core Theory & Mathematical Formulation

The **A\*** search algorithm is an informed search technique that evaluates nodes using the cost function:

$$\Large f(n) = g(n) + h(n)$$

| Component | Meaning | Description |
| :--- | :--- | :--- |
| **$g(n)$** | **Exact Path Cost** | Cost to reach current node $n$ from the start position (`S`). |
| **$h(n)$** | **Heuristic Cost** | Estimated distance from current node $n$ to the goal (`G`). |
| **$f(n)$** | **Total Priority** | Lowest estimated total cost of path passing through node $n$. |

### Heuristic Function: Manhattan Distance
For 4-directional grid movement (Up, Down, Left, Right), Manhattan Distance is optimal and admissible:

$$\Large h(n) = |x_1 - x_2| + |y_1 - y_2|$$

---

## 📂 Project Structure

```text
sam/
├── maze_astar.py       # Standalone Python lab submission script
├── index.html          # Web visualizer markup & lab modal
├── style.css           # Modern cyberpunk glassmorphic design system
├── app.js              # A* visualization engine, interactive grid & sound
└── README.md           # Project documentation & lab guide
```

---

## 🚀 How to Run

### Option 1: Run the Python Lab Script

Run directly using any Python 3 environment without installing extra libraries:

```bash
python maze_astar.py
```

#### Terminal Output:
```text
=====================================================
  MAZE PATHFINDER USING A* HEURISTIC SEARCH (LAB)   
=====================================================

Initial Maze
---------------
  S 0 1 0 0 0
  0 0 1 0 1 0
  0 1 0 0 1 0
  0 1 0 1 1 0
  0 0 0 0 1 0
  1 1 1 0 0 G
---------------
[+] Shortest path found! Total steps: 10
[+] Path coordinates: [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (4, 1), (4, 2), (4, 3), (5, 3), (5, 4), (5, 5)]

Solved Maze (Path marked with '*')
---------------
  S 0 1 0 0 0
  * 0 1 0 1 0
  * 1 0 0 1 0
  * 1 0 1 1 0
  * * * * 1 0
  1 1 1 * * G
---------------
```

---

### Option 2: Launch the Web Visualizer

1. Start a local server:
   ```bash
   python -m http.server 5173
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

#### Web Features:
- 🖌️ **Interactive Grid**: Click and drag to place walls (`1`), erase (`0`), or reposition Start (`S`) and Goal (`G`).
- ⚡ **Animation Controls**: Play, pause, step-by-step next, and speed slider.
- 🔍 **Live Inspector**: Hover over any cell to see real-time $g(n)$, $h(n)$, and $f(n)$ scores.
- 🗺️ **Maze Presets**: Lab 6x6 Default, Dead-End Trap, Spiral Pattern, and Random Walls.
- 📐 **Multiple Heuristics**: Manhattan, Euclidean, and Chebyshev distance.
- 🐍 **Export Python Code**: Download or copy custom-drawn mazes as ready-to-run Python code.
- 🔊 **Web Audio Synthesizer**: Audio feedback during node exploration and path finding.

---

## 📋 Algorithm Steps (Pseudocode)

```text
1. Locate Start 'S' and Goal 'G' coordinates in maze.
2. Initialize open_list with Start node (priority = h(Start)).
3. Initialize closed_set = empty.
4. While open_list is not empty:
     a. current = pop node with lowest f(n) from open_list
     b. If current == Goal:
          Reconstruct path by following parent links and return.
     c. Add current to closed_set.
     d. For each 4-directional neighbor of current:
          i.   If neighbor is out of bounds, a wall ('1'), or in closed_set: continue
          ii.  tentative_g = g(current) + 1
          iii. If tentative_g < g(neighbor):
                 parent[neighbor] = current
                 g[neighbor] = tentative_g
                 h[neighbor] = Manhattan_Distance(neighbor, Goal)
                 f[neighbor] = g[neighbor] + h[neighbor]
                 Add neighbor to open_list
5. Return "No path found" if open_list empties without reaching Goal.
```

---

## 🎓 Viva Questions & Answers (Lab Prep)

1. **Why is A\* preferred over Dijkstra's algorithm?**
   - *Answer:* Dijkstra explores equally in all directions (uninformed), whereas A\* uses a heuristic $h(n)$ to bias the search towards the goal, expanding far fewer nodes.

2. **What makes a heuristic "admissible"?**
   - *Answer:* A heuristic is admissible if it never overestimates the actual cost to reach the goal. Manhattan distance on a 4-connected grid without diagonal moves is admissible.

3. **What happens if $h(n) = 0$ for all nodes?**
   - *Answer:* $f(n) = g(n)$, turning A\* into standard **Dijkstra's Algorithm**.

4. **What data structure is used for the Open List?**
   - *Answer:* A **Min-Heap (Priority Queue)**, implemented via Python's built-in `heapq` module for $O(\log N)$ extraction.

---

## 📜 License
This project is open-source under the [MIT License](LICENSE). Suitable for academic lab submissions and educational demonstrations.
