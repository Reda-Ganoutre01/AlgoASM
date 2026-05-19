; sort.asm  --  Step-by-step sorting primitives for AlgoASM
; nasm -f win32 sort.asm -o sort.obj
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

section .text
global _arr_ptr, _arr_n, _cmp_a, _cmp_b, _sort_done
global _bubble_init,    _bubble_step
global _selection_init, _selection_step
global _insertion_init, _insertion_step

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
;  BUBBLE SORT
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
    dec  eax                 ; limit = n-i-1
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
;  SELECTION SORT
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
;  INSERTION SORT
; =====================================================================
_insertion_init:
    push ebp
    mov  ebp, esp
    mov  eax, [ebp+8]
    mov  [_arr_ptr], eax
    mov  eax, [ebp+12]
    mov  [_arr_n], eax
    mov  dword [_si], 1      ; i starts at 1
    xor  eax, eax
    mov  [_sj],        eax
    mov  [_sort_done], eax
    pop  ebp
    ret

; State: _si = current key index, _sj = j (shifting pointer)
; On each call we do ONE shift (or place key and advance i)
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
    ; initialise j for this key if _sj==0
    mov  edx, [_sj]
    test edx, edx
    jnz  .do_shift
    mov  edx, ecx           ; j = i
    mov  [_sj], edx
.do_shift:
    mov  edx, [_sj]
    test edx, edx
    jz   .place_key
    mov  edi, edx
    dec  edi                ; j-1
    mov  eax, [esi + edi*4]
    mov  ebx, [esi + edx*4]
    mov  [_cmp_a], edi
    mov  [_cmp_b], edx
    cmp  eax, ebx
    jle  .place_key
    ; shift: arr[j] = arr[j-1]
    mov  [esi + edx*4], eax
    dec  dword [_sj]
    xor  eax, eax
    jmp  .ret
.place_key:
    ; arr[j] already correct, advance i
    inc  dword [_si]
    mov  dword [_sj], 0
    xor  eax, eax
    jmp  .ret
.mark_done:
    mov  dword [_sort_done], 1
.done:
    mov  eax, 1
    jmp  .ret
.ret:
    pop  edi
    pop  ebx
    pop  ebp
    ret
