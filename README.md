# AlgoASM - Algorithm Visualiser

A high-performance algorithm visualization tool built with **x86-32 Assembly** (NASM) and **C** with a Win32 GUI. Visualize sorting algorithms, binary search trees, and graph traversal algorithms in real-time.

---

## 📋 Project Overview

**AlgoASM** is an interactive educational tool that demonstrates fundamental algorithms through step-by-step visualization:

- **Sorting Algorithms**: Bubble Sort, Selection Sort, Insertion Sort
- **Data Structures**: Binary Search Tree (BST) with insertion and traversal
- **Graph Algorithms**: BFS (Breadth-First Search) and DFS (Depth-First Search) on a 9-node graph
- **GUI**: Tabbed Win32 interface with real-time animation and complexity analysis
- **Web Interface**: Optional HTML/CSS web-based visualizer

---

## 🏗️ Project Structure

```
AlgoASM/
├── main.c           # Win32 GUI application (Windows)
├── sort.asm         # Assembly: Bubble, Selection, Insertion sort steps
├── tree.asm         # Assembly: BST and Graph algorithms (BFS/DFS)
├── index.html       # Web-based visualizer (alternative interface)
├── build.bat        # Build script for Windows
└── README.md        # This file
```

---

## 🔧 Requirements

### Windows 32-bit Development Environment

**Required Tools:**

1. **NASM** (Netwide Assembler)
   - Download: https://nasm.us/
   - Extract and add to system PATH
   - Supports x86-32 assembly compilation

2. **MinGW-w64** (GNU Compiler Collection for Windows)
   - Download: https://www.mingw-w64.org/
   - Install 32-bit version (i686)
   - Add to system PATH

3. **Windows SDK** (for Win32 headers)
   - Included with Visual Studio or download separately
   - Provides `windows.h`, `gdi32.lib`, `user32.lib`, etc.

**Verify Installation:**
```bash
nasm --version          # Should show NASM version
gcc --version           # Should show GCC (MinGW) for 32-bit
```

---

## 🚀 Building & Running

### Option 1: Automatic Build (Recommended)

```bash
cd c:\Users\bgano\OneDrive\Desktop\AlgoASM
build.bat
```

This script:
1. Compiles `sort.asm` → `sort.obj`
2. Compiles `tree.asm` → `tree.obj`
3. Compiles `main.c` → `main.obj`
4. Links all objects → `AlgoASM.exe`
5. Automatically runs the executable

### Option 2: Manual Build

```bash
# Assemble sorting algorithms
nasm -f win32 sort.asm -o sort.obj

# Assemble tree/graph algorithms
nasm -f win32 tree.asm -o tree.obj

# Compile C source
gcc -c main.c -o main.obj -m32 -O2

# Link all objects
gcc main.obj sort.obj tree.obj ^
    -o AlgoASM.exe ^
    -m32 ^
    -luser32 -lgdi32 -lkernel32 -lcomctl32 ^
    -mwindows -s

# Run
AlgoASM.exe
```

---

## 📖 Core Components

### 1. **main.c** - Win32 GUI Application

**Responsibilities:**
- Creates tabbed Win32 window interface
- Manages three tabs: Sorting, Binary Trees, Graphs
- Handles user input (Start, Reset, Speed slider, Algorithm selection)
- Renders real-time animation of algorithm steps
- Displays algorithm complexity (Best, Average, Worst, Space)

**Key Globals:**
- `g_sort[]` - Array of integers to sort (40 elements)
- `g_tab` - Current active tab (0=Sort, 1=Tree, 2=Graph)
- `g_algo` - Selected sorting algorithm (0=Bubble, 1=Selection, 2=Insertion)
- `g_speed` - Animation speed (1-100)

**Color Scheme:**
- `C_BG` - Dark background
- `C_GREEN` - Active/correct elements
- `C_RED` - Elements being compared
- `C_ORANGE` - Swap operations
- `C_BLUE` - Pivot/current element
- `C_PURPLE` - Tree/graph nodes

---

### 2. **sort.asm** - Sorting Primitives

**Implemented Algorithms:**

#### **Bubble Sort**
- **Functions**: `_bubble_init()`, `_bubble_step()`
- **Logic**: Compares adjacent elements, swaps if out of order
- **Complexity**: O(n²) average case
- **Best Case**: O(n) when array is already sorted
- **Visualization**: Highlights compared elements, shows swaps

#### **Selection Sort**
- **Functions**: `_selection_init()`, `_selection_step()`
- **Logic**: Finds minimum element in unsorted portion, swaps to position
- **Complexity**: O(n²) for all cases
- **Visualization**: Shows current min and sorted boundary

#### **Insertion Sort**
- **Functions**: `_insertion_init()`, `_insertion_step()`
- **Logic**: Inserts each element into its correct position
- **Complexity**: O(n) best, O(n²) average/worst
- **Visualization**: Shows insertion pointer and sorted section

**Assembly Registers Used:**
- `EAX`, `EBX` - Temporary values for comparison/swap
- `ECX`, `EDX` - Array indices
- `ESI` - Array pointer base address
- `EBP` - Stack frame pointer

**External Variables (BSS Section):**
- `_arr_ptr` - Pointer to sort array
- `_arr_n` - Array size
- `_cmp_a`, `_cmp_b` - Indices being compared (for GUI highlighting)
- `_sort_done` - Flag indicating completion
- `_si`, `_sj` - Inner/outer loop indices
- `_smin` - Selection sort minimum index

---

### 3. **tree.asm** - Tree & Graph Algorithms

**Binary Search Tree (BST):**
- **Node Structure** (20 bytes):
  - Offset 0: `value` (int) - Node value
  - Offset 4: `left` (int) - Left child index or -1
  - Offset 8: `right` (int) - Right child index or -1
  - Offset 12: `px` (int) - X position for drawing
  - Offset 16: `py` (int) - Y position for drawing

- **Functions**:
  - `_bst_clear()` - Initialize empty tree
  - `_bst_insert(int)` - Insert value maintaining BST property
  - Max 63 nodes, automatically positions nodes for visualization

**Graph Algorithms** (9-node graph):

#### **BFS (Breadth-First Search)**
- **Functions**: `_bfs_init(int)`, `_bfs_step()`
- **Data Structure**: Queue (FIFO) in `_bfs_queue`
- **Output**: `_bfs_visited[]` tracks visited nodes
- **Variables**: `_bfs_head`, `_bfs_tail`, `_bfs_cur`, `_bfs_done`

#### **DFS (Depth-First Search)**
- **Functions**: `_dfs_init(int)`, `_dfs_step()`
- **Data Structure**: Stack (LIFO) in `_dfs_stack`
- **Output**: `_dfs_visited[]` tracks visited nodes
- **Variables**: `_dfs_top`, `_dfs_cur`, `_dfs_done`

**Graph Structure** (Adjacency Matrix):
```
Node 0 → [1, 2]
Node 1 → [0, 3, 4]
Node 2 → [0, 5]
Node 3 → [1, 6]
Node 4 → [1, 7]
Node 5 → [2, 8]
Node 6 → [3]
Node 7 → [4]
Node 8 → [5]
```

---

### 4. **index.html** - Web Interface

**Features:**
- Browser-based alternative to Win32 GUI
- Same color scheme and layout
- Tab-based interface with identical functionality
- CSS Grid layout with canvas/SVG rendering support

**Sections:**
- Header with title and tabs
- Controls panel (Start, Reset, Speed slider)
- Canvas area for visualizations
- Statistics display (comparisons, swaps, time)

---

## 🎮 Using the GUI

### Main Window

**Tabs:**
1. **Sorting** - Visualize sorting algorithms on 40-element array
2. **Binary Tree** - Insert values into BST
3. **Graphs** - Traverse 9-node graph with BFS/DFS

### Controls

| Control | Function |
|---------|----------|
| **Start/Pause** | Begin or pause algorithm execution |
| **Reset** | Clear data and return to initial state |
| **Speed Slider** | Adjust animation speed (1=slow, 100=fast) |
| **Algorithm Dropdown** | Select which algorithm to visualize |

### Sorting Tab

**Default State:**
- 40 randomly shuffled integers (1-40)
- Three algorithm options: Bubble, Selection, Insertion
- Real-time step animation

**Visual Feedback:**
- Green bars = correctly sorted elements
- Red bars = elements being compared
- Orange bars = elements being swapped
- Blue bars = pivot/current element

### Tree Tab

**Functionality:**
- Insert predefined values: [50, 30, 70, 20, 40, 60, 80, 10, 25]
- Auto-positions nodes for tree visualization
- Shows parent-child connections

### Graph Tab

**Functionality:**
- Choose between BFS and DFS
- Select starting node
- Watch algorithm traverse 9-node connected graph
- Visited nodes highlighted

---

## 🔌 Calling Convention

**x86-32 cdecl (C Declaration)**

All assembly functions use the `__cdecl` calling convention:

```
Arguments: Passed on stack (right to left)
Return: EAX register
Frame Pointer: EBP (preserved)
Caller cleanup: Stack popped by caller
```

**Example Function Call:**

```asm
_bubble_step:
    push ebp
    mov  ebp, esp        ; Save frame
    ; Function logic
    pop  ebp
    ret                  ; Return to caller
```

---

## 📊 Complexity Analysis

### Sorting Algorithms

| Algorithm | Best | Average | Worst | Space |
|-----------|------|---------|-------|-------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) |

### Graph Traversal

| Algorithm | Time | Space | Notes |
|-----------|------|-------|-------|
| BFS | O(V+E) | O(V) | Queue-based, finds shortest paths |
| DFS | O(V+E) | O(h) | Stack-based, explores deeply first |

---

## 🐛 Troubleshooting

### Build Errors

**Error: `nasm: not found`**
- Install NASM from https://nasm.us/
- Add NASM to system PATH
- Restart terminal

**Error: `gcc: not found` or `fatal error: windows.h: No such file`**
- Install MinGW-w64 32-bit version from https://www.mingw-w64.org/
- Add MinGW bin directory to PATH
- Verify: `gcc -m32 --version`

**Error: `undefined reference to '_bubble_init'`**
- Ensure all .asm files assembled successfully
- Check `sort.obj` and `tree.obj` exist
- Rebuild: `build.bat clean && build.bat`

### Runtime Issues

**GUI doesn't appear:**
- Check Windows version (requires Windows XP+)
- Run as Administrator if UAC blocking
- Verify Win32 API DLLs present

**Animation too slow/fast:**
- Adjust Speed slider (1-100)
- Check system performance
- Close other applications

---

## 🚀 Extending the Project

### Add a New Sorting Algorithm

1. **Edit `sort.asm`:**
   - Add `_your_sort_init` and `_your_sort_step` functions
   - Follow existing pattern (save state, return completion flag)
   - Export symbols globally

2. **Edit `main.c`:**
   - Declare external functions
   - Add to `SORT_NAMES[]` array
   - Add complexity data
   - Update `init_sort()` and `step_animation()` switches

3. **Recompile:** `build.bat`

### Add Graph Traversal Algorithm

1. **Edit `tree.asm`:**
   - Implement `_algo_init` and `_algo_step`
   - Add tracking variables
   - Use provided graph adjacency matrix `_graph_adj`

2. **Update `main.c`:**
   - Add algorithm selection
   - Call appropriate init/step functions
   - Render results

---

## 📝 License & Credits

- **Architecture**: x86-32 32-bit (Intel/AMD)
- **Assembly**: NASM syntax
- **C Compiler**: GCC (MinGW)
- **UI Framework**: Win32 API
- **Platform**: Windows (XP+)

---

## 💡 Key Learning Points

1. **x86 Assembly Fundamentals**
   - Register usage and calling conventions
   - Stack frame management
   - Loop structures and branching

2. **Algorithm Implementation**
   - Step-by-step execution (not monolithic)
   - State management for visualization
   - Comparison/swap operations

3. **Win32 GUI Programming**
   - Window creation and messaging
   - Graphics rendering with GDI
   - Control management (buttons, tabs, sliders)

4. **C-Assembly Interop**
   - External symbol declarations
   - Data structure layouts
   - Callback patterns

---

## 📞 Support

For issues or questions:
1. Check build tool versions match requirements
2. Verify all .asm files in same directory
3. Ensure 32-bit (i686) architecture targeted
4. Review error messages in build output

---

**Last Updated**: 2026-05-19  
**Maintainer**: GitHub User
