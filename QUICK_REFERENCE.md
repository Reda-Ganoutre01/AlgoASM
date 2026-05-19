# AlgoASM v2.0 - Quick Reference Guide

## 🚀 Quick Start

```bash
cd c:\Users\bgano\OneDrive\Desktop\AlgoASM
build_v2.bat
```

That's it! The application will launch automatically.

---

## 🎮 Interface Overview

```
┌─────────────────────────────────────────────────────┐
│  AlgoASM v2.0 - Algorithm Visualiser               │
├───────────┬───────────┬───────────┬────────────────┤
│ [SORT] │ [BST]  │ [RBT]  │ [GRAPH]    │ <-- Tabs
├─────────────────────────────────────────────────────┤
│                                                     │
│          MAIN VISUALIZATION AREA                   │
│          (40 bars / Tree / Graph)                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Algorithm: [▼] Tree: [▼] ▶START  ↺RESET   [Speed>]│
└─────────────────────────────────────────────────────┘
```

---

## 5️⃣ Sorting Algorithms

### 1. Bubble Sort
- **Complexity**: O(n) best, O(n²) avg/worst
- **Space**: O(1)
- **Best For**: Learning, nearly sorted data
- **Visualization**: Orange vs Red comparisons

### 2. Selection Sort
- **Complexity**: O(n²) all cases
- **Space**: O(1)
- **Best For**: Predictable performance
- **Visualization**: Min element highlighted

### 3. Insertion Sort
- **Complexity**: O(n) best, O(n²) avg/worst
- **Space**: O(1)
- **Best For**: Small arrays, online sorting
- **Visualization**: Insertion pointer movement

### 4. Quick Sort ⭐ NEW
- **Complexity**: O(n log n) avg, O(n²) worst
- **Space**: O(log n) recursion
- **Best For**: Large arrays, general purpose
- **Visualization**: Pivot selection, partition progress

### 5. Merge Sort ⭐ NEW
- **Complexity**: O(n log n) all cases
- **Space**: O(n) auxiliary
- **Best For**: Guaranteed performance, stability
- **Visualization**: Merge progress, sorted sections

---

## 🌳 Tree Structures

### Binary Search Tree (BST)
- **Insert**: O(log n) avg, O(n) worst
- **Properties**:
  - Left < Parent < Right
  - May become unbalanced
  - Simple implementation
- **Visual**: Blue nodes, cyan circles

### Red-Black Tree (RBT) ⭐ NEW
- **Insert**: O(log n) guaranteed
- **Properties**:
  - Self-balancing
  - RED/BLACK color rules
  - Height O(log n) guaranteed
- **Visual**: 
  - RED nodes: Red background, yellow text
  - BLACK nodes: Blue background, lime text

**Node Values (Demo):**
```
[50, 30, 70, 20, 40, 60, 80, 10, 25]
```

---

## 📊 Graph Algorithms (9 Nodes)

### BFS - Breadth-First Search
- **Time**: O(V+E)
- **Space**: O(V)
- **Order**: Level-by-level
- **Use**: Shortest paths, connectivity

### DFS - Depth-First Search
- **Time**: O(V+E)
- **Space**: O(h) height
- **Order**: Deep-first exploration
- **Use**: Topological sort, cycles

**Graph Layout:**
```
        0 -- 1 -- 3
       /     |     |
      2      4     6
      |      |
      5      7
      |
      8
```

---

## 🎨 Color Meanings

### Sorting Tab
| Color | Meaning |
|-------|---------|
| 🟢 Lime | Complete/sorted |
| 🟠 Orange | Primary comparison |
| 🔴 Red | Secondary comparison |
| 🔵 Blue/Cyan | Unsorted values |
| ⚫ Black | Background |

### Tree Tabs
| Color | Meaning |
|-------|---------|
| 🟦 Blue | Normal nodes |
| 🔴 Red | RBT RED nodes |
| ⬛ Dark Blue | RBT BLACK nodes |
| 🟤 Grey | Edges/connections |

### Graph Tab
| Color | Meaning |
|-------|---------|
| 🟦 Cyan | Unvisited node |
| 🟣 Purple | Visited node |
| 🟨 Yellow | Current node |
| 🟤 Grey | Edges |

---

## ⌨️ Keyboard/Control Tips

| Action | Effect |
|--------|--------|
| Tab Select | Switch between algorithm families |
| Combo Box | Choose specific algorithm |
| Speed Slider | 1=slowest, 120=fastest |
| ▶ START | Begin algorithm execution |
| ⏸ PAUSE | Pause execution |
| ↺ RESET | Reset to initial state |

---

## 📈 Statistics Panel (Sorting Tab)

```
TIME COMPLEXITY
──────────────
Best:  O(n log n)      ← Optimal scenario
Avg:   O(n log n)      ← Average case
Worst: O(n²)           ← Worst scenario
Space: O(log n)        ← Extra memory

LEGEND
 🟠 Cmp A
 🔴 Cmp B
 🟢 Sorted
 🟢 Default

Comparisons: 1,234
Swaps: 567
```

---

## 🔧 Troubleshooting Checklist

**Doesn't start?**
- [ ] NASM added to PATH (restart terminal)
- [ ] MinGW-w64 32-bit installed
- [ ] Run `build_v2.bat` from project directory

**Wrong colors?**
- [ ] Windows using legacy graphics mode?
- [ ] Try updating graphics drivers
- [ ] Restart application

**Too slow?**
- [ ] Close other applications
- [ ] Reduce animation complexity (resize window smaller)
- [ ] Use max speed slider (120)

**Crashes during execution?**
- [ ] Try with smaller test data
- [ ] Check available RAM
- [ ] Recompile: `build_v2.bat`

---

## 📐 Quick Math Reference

### Sorting Complexity
- **Linear**: O(n) - Best case Bubble/Insertion
- **Quadratic**: O(n²) - Most basic sorts worst
- **Log-Linear**: O(n log n) - Quick/Merge average
- **Linearithmic**: O(n log n) - Merge guaranteed

### Space Complexity
- **Constant**: O(1) - In-place sorts
- **Logarithmic**: O(log n) - Quick Sort recursion
- **Linear**: O(n) - Merge Sort auxiliary

### Tree Operations
- **Balanced**: O(log n) - Red-Black Tree
- **Unbalanced**: O(n) - BST worst case
- **Guarantee**: O(log n) - RBT always

---

## 🎯 Use Cases

### Best Algorithm For:
- **Small arrays** (< 10 elements): Insertion Sort
- **Medium arrays** (10-1000): Merge Sort (stable)
- **Large arrays** (> 1000): Quick Sort (fast)
- **External sort**: Merge Sort (divide-conquer)
- **Online sort**: Insertion Sort (incremental)
- **Guaranteed time**: Merge Sort or RBT

### When To Use Trees:
- **Search**: Both BST and RBT
- **Balance guarantee**: Red-Black Tree
- **Simpler code**: Binary Search Tree
- **Production DB**: Red-Black Tree
- **Learning**: BST then RBT

---

## 💾 File Structure

```
AlgoASM/
├── main_enhanced.c          ← GUI & visualization
├── sort_extended.asm        ← 5 sorting algorithms
├── tree_extended.asm        ← Trees & graphs
├── build_v2.bat            ← Build script
├── AlgoASM.exe             ← Compiled executable
├── README.md               ← Full documentation
├── RELEASE_NOTES.md        ← What's new in v2.0
└── QUICK_REFERENCE.md      ← This file
```

---

## 🚀 Performance Tips

1. **Speed Control**
   - Use slider 1-20 for careful step-by-step watching
   - Use slider 80+ for quick overall visualization
   - Use slider 120 for instant completion

2. **Visual Clarity**
   - Resize window to 1200x800+ for best visibility
   - Use fullscreen for large monitors
   - Adjust window lighting (dark room recommended)

3. **CPU Usage**
   - Algorithm speed doesn't increase CPU load much
   - GDI rendering is lightweight
   - Can safely max out speed slider

---

## 📚 Learning Path

**Recommended Study Order:**
1. Start with Bubble Sort (simplest)
2. Progress to Insertion Sort (practical)
3. Learn Selection Sort (different approach)
4. Study Quick Sort (important for production)
5. Master Merge Sort (guaranteed O(n log n))
6. Explore Binary Search Tree (basic structure)
7. Understand Red-Black Tree (self-balancing)
8. Study BFS/DFS (graph fundamentals)

---

## ⏱️ Time Estimates

| Algorithm | 40 Elements | Visualization |
|-----------|------------|----------------|
| Bubble Sort | 1-2 sec | Many steps |
| Selection Sort | 1-2 sec | Fast steps |
| Insertion Sort | <1 sec | Few steps |
| Quick Sort | <1 sec | Balanced splits |
| Merge Sort | <1 sec | Smooth merges |

---

## 🎓 Key Concepts

**Stable Sort** - Equal elements maintain original order
- Bubble: ✓ Yes
- Selection: ✗ No
- Insertion: ✓ Yes
- Quick: ✗ No
- Merge: ✓ Yes

**In-Place Sort** - No extra memory for sorting
- Bubble: ✓ Yes (O(1))
- Selection: ✓ Yes (O(1))
- Insertion: ✓ Yes (O(1))
- Quick: ✓ Yes (O(log n) stack)
- Merge: ✗ No (needs O(n))

---

**Version**: 2.0 | **Last Updated**: May 2026 | **Status**: Ready to Use ✓
