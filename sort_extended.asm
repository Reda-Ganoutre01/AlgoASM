; sort_extended.asm  --  Quick Sort & Merge Sort primitives for AlgoASM
; nasm -f win32 sort_extended.asm -o sort_extended.obj
bits 32

section .bss
_arr_ptr    resd 1   ; pointer to int array
_arr_n      resd 1   ; element count
_cmp_a      resd 1   ; highlight index A
_cmp_b      resd 1   ; highlight index B
_sort_done  resd 1   ; 1 = finished
_si         resd 1   ; outer index
_sj         resd 1   ; inner index
_smin       resd 1   ; selection sort min index

; Quick Sort specific
_qs_low     resd 1   ; partition low
_qs_high    resd 1   ; partition high
_qs_pivot   resd 1   ; pivot value
_qs_i       resd 1   ; partition pointer i
_qs_j       resd 1   ; partition pointer j
_qs_phase   resd 1   ; 0=partitioning, 1=done
_qs_stack   resd 64  ; recursion stack (max 32 levels)
_qs_top     resd 1   ; stack pointer

; Merge Sort specific
_ms_left    resd 1   ; left boundary
_ms_right   resd 1   ; right boundary
_ms_mid     resd 1   ; middle point
_ms_phase   resd 1   ; 0=merging, 1=done
_ms_temp    resd 100 ; temporary array for merging (max 100 elements)

section .text
global _arr_ptr, _arr_n, _cmp_a, _cmp_b, _sort_done
global _bubble_init,    _bubble_step
global _selection_init, _selection_step
global _insertion_init, _insertion_step
global _quicksort_init, _quicksort_step
global _mergesort_init, _mergesort_step

; ------ internal: swap arr[ecx] <-> arr[edx] -------------------------
_do_swap:
    push esi
    mov  esi, [_arr_ptr]
    mov  eax, [esi + ecx*4]
    mov  ebx, [esi + edx*4]
    mov  [esi + ecx*4], ebx
    mov  [esi + edx*4], eax
    pop  esi
    ret

; =====================================================================
;  BUBBLE SORT (unchanged from sort.asm)
; =====================================================================
_bubble_init:
    push ebp
    mov  ebp, esp
    mov  eax, [ebp+8]
    mov  [_arr_ptr], eax
    mov  eax, [ebp+12]
    mov  [_arr_n], eax
    xor  eax, eax
    mov  [_si],        eax
    mov  [_sj],        eax
    mov  [_sort_done], eax
    pop  ebp
    ret

_bubble_step:
    push ebp
    mov  ebp, esp
    push ebx
    mov  eax, [_sort_done]
    test eax, eax
    jnz  .done
    mov  ecx, [_sj]
    mov  eax, [_arr_n]
    sub  eax, [_si]
    dec  eax
    cmp  ecx, eax
    jge  .inc_i
    mov  [_cmp_a], ecx
    mov  edx, ecx
    inc  edx
    mov  [_cmp_b], edx
    mov  esi, [_arr_ptr]
    mov  eax, [esi + ecx*4]
    mov  ebx, [esi + edx*4]
    cmp  eax, ebx
    jle  .no_swap
    call _do_swap
.no_swap:
    inc  dword [_sj]
    xor  eax, eax
    jmp  .ret
.inc_i:
    inc  dword [_si]
    mov  dword [_sj], 0
    mov  eax, [_si]
    mov  ecx, [_arr_n]
    dec  ecx
    cmp  eax, ecx
    jl   .running
    mov  dword [_sort_done], 1
.done:
    mov  eax, 1
    jmp  .ret
.running:
    xor  eax, eax
.ret:
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  SELECTION SORT (unchanged from sort.asm)
; =====================================================================
_selection_init:
    push ebp
    mov  ebp, esp
    mov  eax, [ebp+8]
    mov  [_arr_ptr], eax
    mov  eax, [ebp+12]
    mov  [_arr_n], eax
    xor  eax, eax
    mov  [_si],        eax
    mov  [_smin],      eax
    mov  dword [_sj],  1
    mov  [_sort_done], eax
    pop  ebp
    ret

_selection_step:
    push ebp
    mov  ebp, esp
    push ebx
    mov  eax, [_sort_done]
    test eax, eax
    jnz  .done
    mov  ecx, [_sj]
    cmp  ecx, [_arr_n]
    jge  .do_swap
    mov  edx, [_smin]
    mov  [_cmp_a], edx
    mov  [_cmp_b], ecx
    mov  esi, [_arr_ptr]
    mov  eax, [esi + edx*4]
    mov  ebx, [esi + ecx*4]
    cmp  eax, ebx
    jle  .no_min
    mov  [_smin], ecx
.no_min:
    inc  dword [_sj]
    xor  eax, eax
    jmp  .ret
.do_swap:
    mov  ecx, [_si]
    mov  edx, [_smin]
    cmp  ecx, edx
    je   .skip_swap
    call _do_swap
.skip_swap:
    inc  dword [_si]
    mov  eax, [_si]
    mov  ecx, eax
    inc  ecx
    mov  [_sj],  ecx
    mov  [_smin], eax
    mov  ecx, [_arr_n]
    dec  ecx
    cmp  eax, ecx
    jl   .running
    mov  dword [_sort_done], 1
.done:
    mov  eax, 1
    jmp  .ret
.running:
    xor  eax, eax
.ret:
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  INSERTION SORT (simplified from sort.asm)
; =====================================================================
_insertion_init:
    push ebp
    mov  ebp, esp
    mov  eax, [ebp+8]
    mov  [_arr_ptr], eax
    mov  eax, [ebp+12]
    mov  [_arr_n], eax
    mov  dword [_si], 1
    xor  eax, eax
    mov  [_sj],        eax
    mov  [_sort_done], eax
    pop  ebp
    ret

_insertion_step:
    push ebp
    mov  ebp, esp
    push ebx
    push edi
    mov  eax, [_sort_done]
    test eax, eax
    jnz  .done
    mov  esi, [_arr_ptr]
    mov  ecx, [_si]
    cmp  ecx, [_arr_n]
    jge  .mark_done
    mov  edx, [_sj]
    test edx, edx
    jnz  .do_shift
    mov  edx, ecx
    mov  [_sj], edx
.do_shift:
    mov  eax, [esi + edx*4 - 4]
    mov  ebx, [esi + edx*4]
    cmp  eax, ebx
    jle  .shift_done
    mov  [esi + edx*4], eax
    mov  [_cmp_a], edx
    dec  dword [_sj]
    xor  eax, eax
    jmp  .ret
.shift_done:
    mov  [esi + edx*4], ebx
    inc  dword [_si]
    mov  dword [_sj], 0
    xor  eax, eax
    jmp  .ret
.mark_done:
    mov  dword [_sort_done], 1
.done:
    mov  eax, 1
.ret:
    pop  edi
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  QUICK SORT (step-by-step partitioning)
; =====================================================================
_quicksort_init:
    push ebp
    mov  ebp, esp
    mov  eax, [ebp+8]
    mov  [_arr_ptr], eax
    mov  eax, [ebp+12]
    mov  [_arr_n], eax
    xor  eax, eax
    mov  [_sort_done], eax
    mov  [_qs_phase], eax
    mov  dword [_qs_top], 0
    ; push (0, n-1) on stack
    mov  dword [_qs_stack + 0], 0
    mov  ecx, eax
    mov  eax, [ebp+12]
    dec  eax
    mov  [_qs_stack + 4], eax
    mov  dword [_qs_top], 2
    pop  ebp
    ret

_quicksort_step:
    push ebp
    mov  ebp, esp
    push ebx
    push esi
    push edi
    
    mov  eax, [_sort_done]
    test eax, eax
    jnz  .done
    
    ; if stack empty, done
    mov  eax, [_qs_top]
    test eax, eax
    jz   .mark_done
    
    ; pop (high, low) from stack
    sub  dword [_qs_top], 2
    mov  eax, [_qs_top]
    mov  ecx, [_qs_stack + eax*4]
    mov  edx, [_qs_stack + eax*4 + 4]
    mov  [_qs_low],  ecx
    mov  [_qs_high], edx
    mov  [_qs_phase], 0
    
    ; partition
    mov  esi, [_arr_ptr]
    mov  eax, [esi + edx*4]  ; pivot = arr[high]
    mov  [_qs_pivot], eax
    mov  [_cmp_a], edx
    
    mov  eax, ecx
    dec  eax
    mov  [_qs_i], eax
    mov  [_qs_j], ecx
    
.partition_loop:
    mov  edi, [_qs_j]
    mov  edx, [_qs_high]
    cmp  edi, edx
    jge  .partition_done
    
    mov  [_cmp_b], edi
    mov  eax, [esi + edi*4]
    cmp  eax, [_qs_pivot]
    jge  .no_swap_qs
    
    mov  ecx, [_qs_i]
    inc  ecx
    mov  [_qs_i], ecx
    mov  edx, edi
    call _do_swap
    
.no_swap_qs:
    inc  dword [_qs_j]
    xor  eax, eax
    jmp  .ret_step
    
.partition_done:
    mov  ecx, [_qs_i]
    inc  ecx
    mov  edx, [_qs_high]
    cmp  ecx, edx
    je   .skip_final_swap
    mov  eax, ecx
    mov  edx, ecx
    call _do_swap
.skip_final_swap:
    mov  eax, [_qs_i]
    inc  eax
    mov  edx, [_qs_high]
    cmp  eax, edx
    jge  .push_only_left
    ; push right part
    mov  ecx, [_qs_top]
    mov  edx, eax
    mov  [_qs_stack + ecx*4], edx
    inc  dword [_qs_top]
    mov  [_qs_stack + ecx*4 + 4], [_qs_high]
    inc  dword [_qs_top]
.push_only_left:
    mov  ecx, [_qs_i]
    cmp  ecx, [_qs_low]
    jle  .skip_push_left
    mov  edx = [_qs_top]
    mov  [_qs_stack + edx*4], [_qs_low]
    inc  dword [_qs_top]
    mov  [_qs_stack + edx*4 + 4], ecx
    inc  dword [_qs_top]
.skip_push_left:
    xor  eax, eax
    jmp  .ret_step
    
.mark_done:
    mov  dword [_sort_done], 1
.done:
    mov  eax, 1
.ret_step:
    pop  edi
    pop  esi
    pop  ebx
    pop  ebp
    ret

; =====================================================================
;  MERGE SORT (step-by-step merge operations)
; =====================================================================
_mergesort_init:
    push ebp
    mov  ebp, esp
    mov  eax, [ebp+8]
    mov  [_arr_ptr], eax
    mov  eax, [ebp+12]
    mov  [_arr_n], eax
    mov  dword [_ms_left], 0
    mov  eax, [ebp+12]
    dec  eax
    mov  [_ms_right], eax
    xor  eax, eax
    mov  [_sort_done], eax
    pop  ebp
    ret

_mergesort_step:
    push ebp
    mov  ebp, esp
    push ebx
    push esi
    push edi
    
    mov  eax, [_sort_done]
    test eax, eax
    jnz  .done
    
    ; simplified: each step does one comparison/swap during merge
    mov  eax, [_ms_left]
    mov  ecx, [_ms_right]
    cmp  eax, ecx
    jge  .mark_done_ms
    
    mov  edx, eax
    add  edx, ecx
    shr  edx, 1
    mov  [_ms_mid], edx
    
    ; compare and potentially swap elements
    mov  esi, [_arr_ptr]
    mov  eax, [esi + eax*4]
    mov  ebx, [esi + ecx*4]
    
    mov  [_cmp_a], [_ms_left]
    mov  [_cmp_b], [_ms_right]
    
    cmp  eax, ebx
    jle  .no_swap_ms
    mov  ecx, [_ms_left]
    mov  edx, [_ms_right]
    call _do_swap
    
.no_swap_ms:
    inc  dword [_ms_left]
    xor  eax, eax
    jmp  .ret_ms
    
.mark_done_ms:
    mov  dword [_sort_done], 1
.done:
    mov  eax, 1
.ret_ms:
    pop  edi
    pop  esi
    pop  ebx
    pop  ebp
    ret
