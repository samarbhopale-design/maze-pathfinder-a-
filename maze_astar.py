"""
=============================================================================
Project Title: Maze Pathfinder using A* Heuristic Search Algorithm
Purpose: College Python Lab Practical / AI Search Algorithms
Description:
    This script finds the shortest path through a 2D maze from Start ('S') 
    to Goal ('G') using the A* heuristic search algorithm.
    - Open Path : 0
    - Wall      : 1
    - Start     : 'S'
    - Goal      : 'G'
    - Path Found: '*'
=============================================================================
"""

import heapq


def manhattan_distance(point1, point2):
    """
    Calculates the Manhattan Distance heuristic:
    h(n) = |x1 - x2| + |y1 - y2|
    """
    x1, y1 = point1
    x2, y2 = point2
    return abs(x1 - x2) + abs(y1 - y2)


def print_maze(maze, title="Maze:"):
    """
    Utility function to display the 2D maze in a grid format.
    """
    print(f"\n{title}")
    print("-" * (len(maze[0]) * 2 + 3))
    for row in maze:
        print("  " + " ".join(str(cell) for cell in row))
    print("-" * (len(maze[0]) * 2 + 3))


def find_positions(maze):
    """
    Scans the maze to locate the Start ('S') and Goal ('G') coordinates.
    """
    start = None
    goal = None
    for r in range(len(maze)):
        for c in range(len(maze[0])):
            if maze[r][c] == 'S':
                start = (r, c)
            elif maze[r][c] == 'G':
                goal = (r, c)
    return start, goal


def a_star_search(maze):
    """
    A* Algorithm Implementation:
    Finds the shortest path from 'S' to 'G'.

    Formula:
        f(n) = g(n) + h(n)
        - g(n): Exact cost to reach node 'n' from Start.
        - h(n): Estimated cost from node 'n' to Goal (Manhattan distance).
        - f(n): Total estimated cost through node 'n'.
    """
    start, goal = find_positions(maze)

    if not start or not goal:
        print("Error: Start ('S') or Goal ('G') is missing from the maze.")
        return None

    rows = len(maze)
    cols = len(maze[0])

    # Open List: Priority queue storing tuples of (f_score, g_score, (row, col))
    open_list = []
    initial_h = manhattan_distance(start, goal)
    heapq.heappush(open_list, (initial_h, 0, start))

    # came_from: Tracks the best parent node for reconstructing the path
    came_from = {}

    # g_score: Shortest distance recorded from start to each node
    g_score = {start: 0}

    # closed_set: Nodes that have already been evaluated
    closed_set = set()

    # 4-directional movements: Up, Down, Left, Right
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    while open_list:
        # Step 1: Pick the node with the lowest f(n) from the open list
        current_f, current_g, current = heapq.heappop(open_list)

        # Step 2: Check if we reached the goal
        if current == goal:
            # Reconstruct the path from Goal back to Start
            path = []
            curr = current
            while curr in came_from:
                path.append(curr)
                curr = came_from[curr]
            path.append(start)
            path.reverse()  # Reverse to get path from Start -> Goal
            return path

        closed_set.add(current)

        # Step 3: Explore adjacent neighboring cells
        for dr, dc in directions:
            neighbor = (current[0] + dr, current[1] + dc)
            r, c = neighbor

            # Check within grid boundaries
            if 0 <= r < rows and 0 <= c < cols:
                # Check if the cell is a wall
                if maze[r][c] == 1 or maze[r][c] == '1':
                    continue

                # Skip if already evaluated
                if neighbor in closed_set:
                    continue

                # Movement cost to an adjacent neighbor is 1
                tentative_g = current_g + 1

                # If this path to neighbor is better than any previously recorded path
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    h_score = manhattan_distance(neighbor, goal)
                    f_score = tentative_g + h_score
                    heapq.heappush(open_list, (f_score, tentative_g, neighbor))

    # If open list becomes empty and goal was never reached
    return None


def solve_maze(maze):
    """
    Solves the maze, displays before & after states, and reports the results.
    """
    print_maze(maze, "Initial Maze")

    # Run A* Algorithm
    path = a_star_search(maze)

    if path:
        print(f"[+] Shortest path found! Total steps: {len(path) - 1}")
        print(f"[+] Path coordinates: {path}")

        # Create a copy of the maze to draw the solution path with '*'
        solved_maze = [row[:] for row in maze]
        for r, c in path:
            if solved_maze[r][c] not in ('S', 'G'):
                solved_maze[r][c] = '*'

        print_maze(solved_maze, "Solved Maze (Path marked with '*')")
    else:
        print("[-] No path found.")


# -----------------------------------------------------------------------------
# Main Execution (Sample Demonstration for Lab)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    print("=====================================================")
    print("  MAZE PATHFINDER USING A* HEURISTIC SEARCH (LAB)   ")
    print("=====================================================")

    # Sample 6x6 Maze
    # 0 = open path, 1 = wall, 'S' = Start, 'G' = Goal
    sample_maze = [
        ['S',  0,   1,   0,   0,   0 ],
        [ 0,   0,   1,   0,   1,   0 ],
        [ 0,   1,   0,   0,   1,   0 ],
        [ 0,   1,   0,   1,   1,   0 ],
        [ 0,   0,   0,   0,   1,   0 ],
        [ 1,   1,   1,   0,   0,  'G']
    ]

    solve_maze(sample_maze)

    print("\n--- Testing Maze with No Path ---")
    blocked_maze = [
        ['S',  1,   0],
        [ 1,   1,   0],
        [ 0,   0,  'G']
    ]
    solve_maze(blocked_maze)
