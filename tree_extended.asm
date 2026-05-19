; tree_extended.asm  --  Red-Black Tree + existing BST and Graph for AlgoASM
; nasm -f win32 tree_extended.asm -o tree_extended.obj
bits 32

; BST node layout (20 bytes each):
;   0: value (int)
;   4: left  (int, -1 = none)
;   8: right (int, -1 = none)
;  12: px    (int, draw x)
;  16: py    (int, draw y)
BST_MAX   equ 63
NODE_SIZE equ 20

; Red-Black Tree node layout (24 bytes each):
;   0: value (int)
;   4: left  (int, -1 = none)
;   8: right (int, -1 = none)
;  12: parent (int, -1 = none)
;  16: color (int, 0=RED, 1=BLACK)
;  20: px    (int, draw x)
;  22: py    (int, draw y) - Note: only 2 bytes for py
RBT_MAX   equ 63
RBT_NODE_SIZE equ 24

; Graph constants
GRAPH_MAX equ 9

section .data
; Predefined demo graph (GRAPH_MAX x GRAPH_MAX adjacency matrix, row-major)
_graph_adj:
    db 0,1,1,0,0,0,0,0,0
    db 1,0,0,1,1,0,0,0,0
    db 1,0,0,0,0,1,0,0,0
    db 0,1,0,0,0,0,1,0,0
    db 0,1,0,0,0,0,0,1,0
    db 0,0,1,0,0,0,0,0,1
    db 0,0,0,1,0,0,0,0,0
    db 0,0,0,0,1,0,0,0,0
    db 0,0,0,0,0,1,0,0,0

_graph_n    dd GRAPH_MAX

; BFS / DFS queue / stack
_bfs_queue  times 64 dd 0
_dfs_stack  times 64 dd 0

section .bss
; BST storage
_bst_nodes  resb BST_MAX * NODE_SIZE
_bst_count  resd 1

; Red-Black Tree storage
_rbt_nodes  resb RBT_MAX * RBT_NODE_SIZE
_rbt_count  resd 1
_rbt_root   resd 1

; BFS state
_bfs_head       resd 1
_bfs_tail       resd 1
_bfs_visited    resb GRAPH_MAX
_bfs_done       resd 1
_bfs_cur        resd 1

; DFS state
_dfs_top        resd 1
_dfs_visited    resb GRAPH_MAX
_dfs_done       resd 1
_dfs_cur        resd 1

section .text
global _bst_nodes, _bst_count
global _bst_clear, _bst_insert
global _rbt_nodes, _rbt_count, _rbt_root
global _rbt_clear, _rbt_insert
global _graph_adj, _graph_n
global _bfs_init,  _bfs_step,  _bfs_visited, _bfs_cur, _bfs_done
global _dfs_init,  _dfs_step,  _dfs_visited, _dfs_cur, _dfs_done

; =====================================================================
;  BST OPERATIONS (from tree.asm)
; =====================================================================

; void bst_clear(void)
_bst_clear:
    mov  dword [_bst_count], 0
    ret

; void bst_insert(int value)
_bst_insert:
    push ebp
    mov  ebp, esp
    push ebx
    push esi
    push edi

    mov  eax, [_bst_count]
    cmp  eax, BST_MAX
    jge  .done

    mov  edi, eax
    inc  dword [_bst_count]

    mov  ecx, NODE_SIZE
    imul edi, ecx
    lea  esi, [_bst_nodes + edi]
    mov  eax, [ebp+8]
    mov  [esi+0],  eax
    mov  dword [esi+4],  -1
    mov  dword [esi+8],  -1
    mov  dword [esi+12], 0
    mov  dword [esi+16], 0

    mov  eax, [_bst_count]
    cmp  eax, 1
    je   .set_root_pos

    mov  ebx, 0
    mov  edx, [ebp+8]
.walk:
    mov  ecx, NODE_SIZE
    imul ecx, ebx
    lea  esi, [_bst_nodes + ecx]
    mov  eax, [esi+0]
    cmp  edx, eax
    jle  .go_left
    mov  eax, [esi+8]
    cmp  eax, -1
    je   .attach_right
    mov  ebx, eax
    jmp  .walk
.go_left:
    mov  eax, [esi+4]
    cmp  eax, -1
    je   .attach_left
    mov  ebx, eax
    jmp  .walk

.attach_right:
    mov  eax, [_bst_count]
    dec  eax
    mov  [esi+8], eax
    mov  ecx, [esi+12]
    add  ecx, 30
    mov  edx, [esi+16]
    add  edx, 50
    jmp  .save_pos

.attach_left:
    mov  eax, [_bst_count]
    dec  eax
    mov  [esi+4], eax
    mov  ecx, [esi+12]
    sub  ecx, 30
    mov  edx, [esi+16]
    add  edx, 50
    jmp  .save_pos

.set_root_pos:
    mov  ecx, 300
    mov  edx, 40
.save_pos:
    mov  eax, [_bst_count]
    dec  eax
    imul eax, NODE_SIZE
    lea  esi, [_bst_nodes + eax]
    mov  [esi+12], ecx
    mov  [esi+16], edx
.done:
    pop  edi
    pop  esi
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  RED-BLACK TREE OPERATIONS
; =====================================================================

; void rbt_clear(void)
_rbt_clear:
    mov  dword [_rbt_count], 0
    mov  dword [_rbt_root], -1
    ret

; void rbt_insert(int value)
_rbt_insert:
    push ebp
    mov  ebp, esp
    push ebx
    push esi
    push edi

    mov  eax, [_rbt_count]
    cmp  eax, RBT_MAX
    jge  .done

    mov  edi, eax           ; edi = new node index
    inc  dword [_rbt_count]

    ; initialize node
    mov  ecx, RBT_NODE_SIZE
    imul edi, ecx
    lea  esi, [_rbt_nodes + edi]
    mov  eax, [ebp+8]
    mov  [esi+0],  eax      ; value
    mov  dword [esi+4],  -1 ; left = -1
    mov  dword [esi+8],  -1 ; right = -1
    mov  dword [esi+12], -1 ; parent = -1
    mov  dword [esi+16], 0  ; color = RED
    mov  dword [esi+20], 0  ; px
    mov  dword [esi+22], 0  ; py

    ; if first node (tree empty)
    mov  eax, [_rbt_count]
    cmp  eax, 1
    jne  .find_parent

    mov  dword [_rbt_root], 0
    mov  dword [esi+16], 1  ; root is BLACK
    mov  dword [esi+20], 300
    mov  dword [esi+22], 40
    jmp  .done

.find_parent:
    ; walk tree to find insertion point
    mov  ebx, [_rbt_root]   ; ebx = current node
    mov  edx, [ebp+8]       ; edx = value to insert

.walk_tree:
    mov  ecx, RBT_NODE_SIZE
    imul ecx, ebx
    lea  esi, [_rbt_nodes + ecx]
    mov  eax, [esi+0]       ; current value
    cmp  edx, eax
    jle  .go_left_rbt
    ; go right
    mov  eax, [esi+8]
    cmp  eax, -1
    je   .attach_right_rbt
    mov  ebx, eax
    jmp  .walk_tree

.go_left_rbt:
    mov  eax, [esi+4]
    cmp  eax, -1
    je   .attach_left_rbt
    mov  ebx, eax
    jmp  .walk_tree

.attach_right_rbt:
    mov  eax, [_rbt_count]
    dec  eax
    mov  [esi+8], eax       ; parent.right = new
    mov  ecx, RBT_NODE_SIZE
    imul eax, ecx
    lea  edi, [_rbt_nodes + eax]
    mov  dword [edi+12], ebx ; new.parent = parent index
    mov  ecx, [esi+20]
    add  ecx, 30
    mov  edx, [esi+22]
    add  edx, 50
    mov  [edi+20], ecx
    mov  [edi+22], edx
    jmp  .done

.attach_left_rbt:
    mov  eax, [_rbt_count]
    dec  eax
    mov  [esi+4], eax
    mov  ecx, RBT_NODE_SIZE
    imul eax, ecx
    lea  edi, [_rbt_nodes + eax]
    mov  dword [edi+12], ebx
    mov  ecx, [esi+20]
    sub  ecx, 30
    mov  edx, [esi+22]
    add  edx, 50
    mov  [edi+20], ecx
    mov  [edi+22], edx

.done:
    pop  edi
    pop  esi
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  BFS  (from tree.asm)
; =====================================================================

; void bfs_init(int start_node)
_bfs_init:
    push ebp
    mov  ebp, esp
    push edi
    lea  edi, [_bfs_visited]
    xor  eax, eax
    mov  ecx, GRAPH_MAX
    rep  stosb
    pop  edi
    xor  eax, eax
    mov  [_bfs_head], eax
    mov  [_bfs_tail], eax
    mov  [_bfs_done], eax
    mov  eax, [ebp+8]
    mov  [_bfs_cur], eax
    mov  ecx, [_bfs_tail]
    mov  [_bfs_queue + ecx*4], eax
    inc  dword [_bfs_tail]
    mov  byte [_bfs_visited + eax], 1
    pop  ebp
    ret

; int bfs_step(void)
_bfs_step:
    push ebp
    mov  ebp, esp
    push ebx
    mov  eax, [_bfs_done]
    test eax, eax
    jnz  .ret_done
    mov  eax, [_bfs_head]
    cmp  eax, [_bfs_tail]
    jge  .mark_bfs_done
    mov  [_bfs_cur], eax
    mov  ecx, [_bfs_queue + eax*4]
    inc  dword [_bfs_head]
    mov  edx, 0
.find_next_adj:
    cmp  edx, GRAPH_MAX
    jge  .no_more_adj
    mov  eax, ecx
    imul eax, GRAPH_MAX
    lea  esi, [_graph_adj + eax]
    mov  al, [esi + edx]
    test al, al
    jz   .skip_adj
    mov  eax, edx
    cmp  byte [_bfs_visited + eax], 0
    jne  .skip_adj
    mov  byte [_bfs_visited + eax], 1
    mov  ecx, [_bfs_tail]
    mov  [_bfs_queue + ecx*4], eax
    inc  dword [_bfs_tail]
.skip_adj:
    inc  edx
    jmp  .find_next_adj
.no_more_adj:
    xor  eax, eax
    jmp  .ret
.mark_bfs_done:
    mov  dword [_bfs_done], 1
.ret_done:
    mov  eax, 1
.ret:
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  DFS  (from tree.asm)
; =====================================================================

; void dfs_init(int start_node)
_dfs_init:
    push ebp
    mov  ebp, esp
    push edi
    lea  edi, [_dfs_visited]
    xor  eax, eax
    mov  ecx, GRAPH_MAX
    rep  stosb
    pop  edi
    xor  eax, eax
    mov  [_dfs_top], eax
    mov  [_dfs_done], eax
    mov  eax, [ebp+8]
    mov  [_dfs_cur], eax
    mov  [_dfs_stack], eax
    inc  dword [_dfs_top]
    mov  byte [_dfs_visited + eax], 1
    pop  ebp
    ret

; int dfs_step(void)
_dfs_step:
    push ebp
    mov  ebp, esp
    mov  eax, [_dfs_done]
    test eax, eax
    jnz  .ret_done
    mov  eax, [_dfs_top]
    test eax, eax
    jz   .mark_dfs_done
    dec  dword [_dfs_top]
    mov  eax, [_dfs_top]
    mov  ecx, [_dfs_stack + eax*4]
    mov  [_dfs_cur], ecx
    mov  edx, 0
.find_unvisited:
    cmp  edx, GRAPH_MAX
    jge  .no_unvisited
    mov  eax, ecx
    imul eax, GRAPH_MAX
    lea  esi, [_graph_adj + eax]
    mov  al, [esi + edx]
    test al, al
    jz   .skip_unvisited
    mov  eax, edx
    cmp  byte [_dfs_visited + eax], 0
    jne  .skip_unvisited
    mov  byte [_dfs_visited + eax], 1
    mov  ecx, [_dfs_top]
    mov  [_dfs_stack + ecx*4], eax
    inc  dword [_dfs_top]
    xor  eax, eax
    jmp  .ret
.skip_unvisited:
    inc  edx
    jmp  .find_unvisited
.no_unvisited:
    xor  eax, eax
    jmp  .ret
.mark_dfs_done:
    mov  dword [_dfs_done], 1
.ret_done:
    mov  eax, 1
.ret:
    pop  ebp
    ret
