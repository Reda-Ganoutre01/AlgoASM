; tree.asm  --  BST + Graph primitives for AlgoASM
; nasm -f win32 tree.asm -o tree.obj
bits 32

; BST node layout (20 bytes each):
;   0: value (int)
;   4: left  (int, -1 = none)
;   8: right (int, -1 = none)
;  12: px    (int, draw x)
;  16: py    (int, draw y)
BST_MAX   equ 63
NODE_SIZE equ 20

; Graph constants
GRAPH_MAX equ 9        ; up to 9 nodes

section .data
; Predefined demo graph (GRAPH_MAX x GRAPH_MAX adjacency matrix, row-major)
_graph_adj:
    db 0,1,1,0,0,0,0,0,0   ; node 0 connects to 1,2
    db 1,0,0,1,1,0,0,0,0   ; node 1 connects to 0,3,4
    db 1,0,0,0,0,1,0,0,0   ; node 2 connects to 0,5
    db 0,1,0,0,0,0,1,0,0   ; node 3 connects to 1,6
    db 0,1,0,0,0,0,0,1,0   ; node 4 connects to 1,7
    db 0,0,1,0,0,0,0,0,1   ; node 5 connects to 2,8
    db 0,0,0,1,0,0,0,0,0   ; node 6 connects to 3
    db 0,0,0,0,1,0,0,0,0   ; node 7 connects to 4
    db 0,0,0,0,0,1,0,0,0   ; node 8 connects to 5

_graph_n    dd GRAPH_MAX

; BFS / DFS queue / stack
_bfs_queue  times 64 dd 0
_dfs_stack  times 64 dd 0

section .bss
; BST storage
_bst_nodes  resb BST_MAX * NODE_SIZE
_bst_count  resd 1

; BFS state
_bfs_head       resd 1
_bfs_tail       resd 1
_bfs_visited    resb GRAPH_MAX
_bfs_done       resd 1
_bfs_cur        resd 1   ; currently processing node

; DFS state
_dfs_top        resd 1
_dfs_visited    resb GRAPH_MAX
_dfs_done       resd 1
_dfs_cur        resd 1

section .text
global _bst_nodes, _bst_count
global _bst_clear, _bst_insert
global _graph_adj, _graph_n
global _bfs_init,  _bfs_step,  _bfs_visited, _bfs_cur, _bfs_done
global _dfs_init,  _dfs_step,  _dfs_visited, _dfs_cur, _dfs_done

; =====================================================================
;  BST OPERATIONS
; =====================================================================

; void bst_clear(void)
_bst_clear:
    mov  dword [_bst_count], 0
    ret

; void bst_insert(int value)
; Finds correct position and adds node; sets px/py based on depth+side
_bst_insert:
    push ebp
    mov  ebp, esp
    push ebx
    push esi
    push edi

    mov  eax, [_bst_count]
    cmp  eax, BST_MAX
    jge  .done               ; tree full

    ; allocate node index = bst_count
    mov  edi, eax            ; edi = new node index
    inc  dword [_bst_count]

    ; initialise node
    mov  ecx, NODE_SIZE
    imul edi, ecx            ; byte offset of new node
    lea  esi, [_bst_nodes + edi]
    mov  eax, [ebp+8]
    mov  [esi+0],  eax       ; value
    mov  dword [esi+4],  -1  ; left  = -1
    mov  dword [esi+8],  -1  ; right = -1
    mov  dword [esi+12], 0   ; px placeholder
    mov  dword [esi+16], 0   ; py placeholder

    ; if first node, place at root and done
    mov  eax, [_bst_count]
    cmp  eax, 1
    je   .set_root_pos

    ; walk tree to find parent
    ; ebx = current node index, start at 0
    mov  ebx, 0
    mov  edx, [ebp+8]        ; value to insert
.walk:
    mov  ecx, NODE_SIZE
    imul ecx, ebx
    lea  esi, [_bst_nodes + ecx]
    mov  eax, [esi+0]        ; current node value
    cmp  edx, eax
    jle  .go_left
    ; go right
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
    ; new node index = bst_count - 1
    mov  eax, [_bst_count]
    dec  eax
    mov  [esi+8], eax        ; parent.right = new
    ; px = parent.px + offset, py = parent.py + 40
    mov  ecx, [esi+12]       ; parent px
    add  ecx, 30
    mov  edx, [esi+16]       ; parent py
    add  edx, 50
    jmp  .save_pos

.attach_left:
    mov  eax, [_bst_count]
    dec  eax
    mov  [esi+4], eax        ; parent.left = new
    mov  ecx, [esi+12]
    sub  ecx, 30
    mov  edx, [esi+16]
    add  edx, 50
    jmp  .save_pos

.set_root_pos:
    mov  ecx, 300            ; root x
    mov  edx, 40             ; root y
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
;  BFS  (on the predefined graph)
; =====================================================================

; void bfs_init(int start_node)
_bfs_init:
    push ebp
    mov  ebp, esp
    ; clear visited
    push edi
    lea  edi, [_bfs_visited]
    xor  eax, eax
    mov  ecx, GRAPH_MAX
    rep  stosb
    pop  edi
    ; reset queue
    xor  eax, eax
    mov  [_bfs_head], eax
    mov  [_bfs_tail], eax
    mov  [_bfs_done], eax
    ; enqueue start
    mov  eax, [ebp+8]
    mov  [_bfs_cur], eax
    mov  ecx, [_bfs_tail]
    mov  [_bfs_queue + ecx*4], eax
    inc  dword [_bfs_tail]
    ; mark start visited
    mov  byte [_bfs_visited + eax], 1
    pop  ebp
    ret

; int bfs_step(void)   returns 1 if done
_bfs_step:
    push ebp
    mov  ebp, esp
    push ebx
    push esi

    mov  eax, [_bfs_done]
    test eax, eax
    jnz  .done

    ; check queue empty
    mov  eax, [_bfs_head]
    cmp  eax, [_bfs_tail]
    jge  .mark_done

    ; dequeue
    mov  ecx, [_bfs_head]
    mov  ebx, [_bfs_queue + ecx*4]
    inc  dword [_bfs_head]
    mov  [_bfs_cur], ebx     ; currently visiting ebx

    ; enqueue unvisited neighbours
    xor  esi, esi            ; neighbour index
.enum_nbr:
    cmp  esi, GRAPH_MAX
    jge  .nbr_done
    ; adj[ebx][esi]  = _graph_adj + ebx*GRAPH_MAX + esi
    mov  eax, ebx
    imul eax, GRAPH_MAX
    add  eax, esi
    movzx eax, byte [_graph_adj + eax]
    test eax, eax
    jz   .next_nbr
    movzx eax, byte [_bfs_visited + esi]
    test eax, eax
    jnz  .next_nbr
    ; mark and enqueue
    mov  byte [_bfs_visited + esi], 1
    mov  ecx, [_bfs_tail]
    mov  [_bfs_queue + ecx*4], esi
    inc  dword [_bfs_tail]
.next_nbr:
    inc  esi
    jmp  .enum_nbr
.nbr_done:
    xor  eax, eax
    jmp  .ret
.mark_done:
    mov  dword [_bfs_done], 1
.done:
    mov  eax, 1
.ret:
    pop  esi
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  DFS  (on the predefined graph)
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
    mov  [_dfs_top],  eax
    mov  [_dfs_done], eax
    ; push start
    mov  eax, [ebp+8]
    mov  [_dfs_cur], eax
    mov  [_dfs_stack], eax
    mov  dword [_dfs_top], 1
    pop  ebp
    ret

; int dfs_step(void)   returns 1 if done
_dfs_step:
    push ebp
    mov  ebp, esp
    push ebx
    push esi

    mov  eax, [_dfs_done]
    test eax, eax
    jnz  .done

    ; check stack empty
    mov  eax, [_dfs_top]
    test eax, eax
    jz   .mark_done

.pop_loop:
    dec  dword [_dfs_top]
    mov  ecx, [_dfs_top]
    mov  ebx, [_dfs_stack + ecx*4]
    movzx eax, byte [_dfs_visited + ebx]
    test eax, eax
    jnz  .check_empty      ; already visited, pop again

    ; mark visited
    mov  byte [_dfs_visited + ebx], 1
    mov  [_dfs_cur], ebx

    ; push unvisited neighbours (reverse order for natural left-right)
    mov  esi, GRAPH_MAX
    dec  esi
.push_nbr:
    cmp  esi, 0
    jl   .nbr_done
    mov  eax, ebx
    imul eax, GRAPH_MAX
    add  eax, esi
    movzx eax, byte [_graph_adj + eax]
    test eax, eax
    jz   .next_nbr
    movzx eax, byte [_dfs_visited + esi]
    test eax, eax
    jnz  .next_nbr
    mov  ecx, [_dfs_top]
    mov  [_dfs_stack + ecx*4], esi
    inc  dword [_dfs_top]
.next_nbr:
    dec  esi
    jmp  .push_nbr
.nbr_done:
    xor  eax, eax
    jmp  .ret

.check_empty:
    mov  eax, [_dfs_top]
    test eax, eax
    jnz  .pop_loop
.mark_done:
    mov  dword [_dfs_done], 1
.done:
    mov  eax, 1
.ret:
    pop  esi
    pop  ebx
    pop  ebp
    ret
