/* main_enhanced.c  --  AlgoASM: Algorithm Visualiser (Win32 GUI + Enhanced UI/UX)
   Calls into sort_extended.asm, tree_extended.asm for step-by-step algorithm execution
   Compile: gcc -c main_enhanced.c -o main.obj -m32
   Link:    gcc main.obj sort_extended.obj tree_extended.obj -o AlgoASM.exe
            -luser32 -lgdi32 -lkernel32 -lcomctl32 -mwindows -s
*/
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <commctrl.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>
#include <stdio.h>
#pragma comment(lib,"comctl32.lib")
#pragma comment(lib,"gdi32.lib")

/* ── external ASM symbols ────────────────────────────────────────── */
extern int  _arr_ptr, _arr_n, _cmp_a, _cmp_b, _sort_done;
extern void __cdecl _bubble_init   (int*,int);
extern int  __cdecl _bubble_step   (void);
extern void __cdecl _selection_init(int*,int);
extern int  __cdecl _selection_step(void);
extern void __cdecl _insertion_init(int*,int);
extern int  __cdecl _insertion_step(void);
extern void __cdecl _quicksort_init(int*,int);
extern int  __cdecl _quicksort_step(void);
extern void __cdecl _mergesort_init(int*,int);
extern int  __cdecl _mergesort_step(void);

typedef struct { int value,left,right,px,py; } BSTNode;
typedef struct { int value,left,right,parent,color,px,py; } RBTNode;

extern BSTNode _bst_nodes[];
extern int     _bst_count;
extern void __cdecl _bst_clear (void);
extern void __cdecl _bst_insert(int);

extern RBTNode _rbt_nodes[];
extern int     _rbt_count, _rbt_root;
extern void __cdecl _rbt_clear (void);
extern void __cdecl _rbt_insert(int);

extern char _graph_adj[];
extern int  _graph_n;
extern void __cdecl _bfs_init(int);
extern int  __cdecl _bfs_step(void);
extern char _bfs_visited[];
extern int  _bfs_cur, _bfs_done;
extern void __cdecl _dfs_init(int);
extern int  __cdecl _dfs_step(void);
extern char _dfs_visited[];
extern int  _dfs_cur, _dfs_done;

/* ── constants ───────────────────────────────────────────────────── */
#define GRAPH_MAX 9
#define SORT_N    40
#define ID_TAB    100
#define ID_START  101
#define ID_RESET  102
#define ID_SPEED  103
#define ID_ALGO   104
#define ID_TREE_TYPE 105
#define ID_TIMER  1
#define TAB_SORT  0
#define TAB_TREE  1
#define TAB_RBT   2
#define TAB_GRAPH 3

/* ── palette (Premium Color Scheme) ──────────────────────────────── */
#define C_BG       RGB(12,14,20)      /* Deep blue-black */
#define C_PANEL    RGB(18,24,35)      /* Dark blue panel */
#define C_ACCENT   RGB(30,40,60)      /* Accent blue */
#define C_GREEN    RGB(52,235,115)    /* Vibrant green */
#define C_LIME     RGB(100,255,130)   /* Light lime */
#define C_DIM      RGB(20,140,60)     /* Dim green */
#define C_ORANGE   RGB(255,140,50)    /* Warm orange */
#define C_YELLOW   RGB(255,200,50)    /* Golden yellow */
#define C_BLUE     RGB(80,180,255)    /* Sky blue */
#define C_CYAN     RGB(100,220,255)   /* Cyan */
#define C_PURPLE   RGB(180,100,255)   /* Purple */
#define C_PINK     RGB(255,100,180)   /* Pink */
#define C_RED      RGB(255,80,100)    /* Red */
#define C_TEXT     RGB(220,230,245)   /* Light text */
#define C_GREY     RGB(100,120,150)   /* Grey */
#define C_DARK_GREY RGB(50,60,80)     /* Dark grey */
#define C_RBT_RED  RGB(255,60,80)     /* RB Tree red */
#define C_RBT_BLK  RGB(40,50,70)      /* RB Tree black */

/* ── graph node positions ────────────────────────────────────────── */
static const int GX[GRAPH_MAX] = {300,180,420,100,260,480,100,260,480};
static const int GY[GRAPH_MAX] = { 60,160,160,260,260,260,360,360,360};

/* ── complexity strings (5 sorting algorithms) ────────────────────── */
static const char* SORT_NAMES[5] = {"Bubble Sort","Selection Sort","Insertion Sort","Quick Sort","Merge Sort"};
static const char* SORT_BEST [5] = {"O(n)","O(n²)","O(n)","O(n log n)","O(n log n)"};
static const char* SORT_AVG  [5] = {"O(n²)","O(n²)","O(n²)","O(n log n)","O(n log n)"};
static const char* SORT_WORST[5] = {"O(n²)","O(n²)","O(n²)","O(n²)","O(n log n)"};
static const char* SORT_SPACE[5] = {"O(1)","O(1)","O(1)","O(log n)","O(n)"};

/* ── globals ──────────────────────────────────────────────────────– */
static HWND  hWnd, hTab, hStart, hReset, hSpeed, hAlgo, hTreeType;
static int   g_tab=TAB_SORT, g_algo=0, g_speed=30;
static BOOL  g_running=FALSE;
static int   g_sort[SORT_N];
static int   g_graph_algo=0;
static int   g_tree_type=0; /* 0=BST, 1=RBT */
static int   g_bst_vals[]={50,30,70,20,40,60,80,10,25};
#define BST_SEED_N 9
static int   g_stats_cmp=0, g_stats_swap=0;

/* ── helpers ──────────────────────────────────────────────────────– */
static void shuffle_sort(void){
    for(int i=0;i<SORT_N;i++) g_sort[i]=i+1;
    for(int i=SORT_N-1;i>0;i--){
        int j=rand()%(i+1);
        int t=g_sort[i]; g_sort[i]=g_sort[j]; g_sort[j]=t;
    }
}
static void init_sort(void){
    shuffle_sort();
    g_stats_cmp=0; g_stats_swap=0;
    switch(g_algo){
        case 0: _bubble_init   (g_sort,SORT_N); break;
        case 1: _selection_init(g_sort,SORT_N); break;
        case 2: _insertion_init(g_sort,SORT_N); break;
        case 3: _quicksort_init(g_sort,SORT_N); break;
        case 4: _mergesort_init(g_sort,SORT_N); break;
    }
}
static void init_tree(void){
    if(g_tree_type==0){
        _bst_clear();
        for(int i=0;i<BST_SEED_N;i++) _bst_insert(g_bst_vals[i]);
    } else {
        _rbt_clear();
        for(int i=0;i<BST_SEED_N;i++) _rbt_insert(g_bst_vals[i]);
    }
}
static void init_graph(void){
    if(g_graph_algo==0) _bfs_init(0);
    else                _dfs_init(0);
}

/* ── GDI helpers ──────────────────────────────────────────────────– */
static HFONT hFontMono, hFontBig, hFontSm, hFontTitle;

static void draw_text(HDC hdc, const char* s, int x, int y, COLORREF c, HFONT f){
    SetTextColor(hdc,c);
    SelectObject(hdc,f);
    TextOutA(hdc,x,y,s,(int)strlen(s));
}
static void fill_rect(HDC hdc,int x,int y,int w,int h,COLORREF c){
    RECT r={x,y,x+w,y+h};
    HBRUSH b=CreateSolidBrush(c);
    FillRect(hdc,&r,b);
    DeleteObject(b);
}
static void draw_circle(HDC hdc,int cx,int cy,int r,COLORREF fill,COLORREF pen){
    HBRUSH br=CreateSolidBrush(fill);
    HPEN   pe=CreatePen(PS_SOLID,2,pen);
    SelectObject(hdc,br); SelectObject(hdc,pe);
    Ellipse(hdc,cx-r,cy-r,cx+r,cy+r);
    DeleteObject(br); DeleteObject(pe);
}
static void draw_line(HDC hdc,int x0,int y0,int x1,int y1,COLORREF c){
    HPEN p=CreatePen(PS_SOLID,2,c);
    SelectObject(hdc,p);
    MoveToEx(hdc,x0,y0,NULL); LineTo(hdc,x1,y1);
    DeleteObject(p);
}
static void draw_thick_line(HDC hdc,int x0,int y0,int x1,int y1,COLORREF c,int width){
    HPEN p=CreatePen(PS_SOLID,width,c);
    SelectObject(hdc,p);
    MoveToEx(hdc,x0,y0,NULL); LineTo(hdc,x1,y1);
    DeleteObject(p);
}

/* ── PAINT: Sorting bars (Enhanced) ──────────────────────────────– */
static void paint_sort(HDC hdc,RECT* rc){
    int cmpA=_cmp_a, cmpB=_cmp_b, done=_sort_done;
    int panW=rc->right-rc->left-240;
    int panH=rc->bottom-rc->top-100;
    int barW=(panW-40)/SORT_N;
    int barMax=panH-60;

    /* draw bars with gradient effect */
    for(int i=0;i<SORT_N;i++){
        int h=(int)((float)g_sort[i]/SORT_N * barMax);
        int x=20+i*barW;
        int y=panH-h+50;
        COLORREF c;
        if(done)              c=C_LIME;
        else if(i==cmpA)      c=C_ORANGE;
        else if(i==cmpB)      c=C_RED;
        else if(h > barMax*0.75)  c=C_BLUE;
        else if(h > barMax*0.5)   c=C_CYAN;
        else                  c=C_GREEN;
        fill_rect(hdc,x,y,barW-3,h,c);
        /* shadow/highlight */
        fill_rect(hdc,x,y,barW-3,2,RGB(255,255,255));
    }

    /* complexity panel */
    int px=panW+30, py=60;
    draw_text(hdc,"TIME COMPLEXITY",px,py,C_CYAN,hFontMono); py+=28;
    draw_thick_line(hdc,px,py,px+190,py,C_GREY,2); py+=12;
    char buf[128];
    sprintf(buf,"Best:  %s",SORT_BEST [g_algo]); draw_text(hdc,buf,px,py,C_LIME,hFontSm); py+=22;
    sprintf(buf,"Avg:   %s",SORT_AVG  [g_algo]); draw_text(hdc,buf,px,py,C_CYAN,hFontSm); py+=22;
    sprintf(buf,"Worst: %s",SORT_WORST[g_algo]); draw_text(hdc,buf,px,py,C_ORANGE,hFontSm); py+=22;
    sprintf(buf,"Space: %s",SORT_SPACE[g_algo]); draw_text(hdc,buf,px,py,C_BLUE,hFontSm); py+=40;
    
    draw_text(hdc,"LEGEND",px,py,C_CYAN,hFontMono); py+=22;
    fill_rect(hdc,px,py,14,14,C_ORANGE); draw_text(hdc," Cmp A",px+18,py-2,C_TEXT,hFontSm); py+=20;
    fill_rect(hdc,px,py,14,14,C_RED);    draw_text(hdc," Cmp B",px+18,py-2,C_TEXT,hFontSm); py+=20;
    fill_rect(hdc,px,py,14,14,C_LIME);   draw_text(hdc," Sorted",px+18,py-2,C_TEXT,hFontSm); py+=20;
    fill_rect(hdc,px,py,14,14,C_GREEN);  draw_text(hdc," Default",px+18,py-2,C_TEXT,hFontSm);

    /* stats */
    py+=40;
    sprintf(buf,"Comparisons: %d",g_stats_cmp);
    draw_text(hdc,buf,px,py,C_BLUE,hFontSm); py+=20;
    sprintf(buf,"Swaps: %d",g_stats_swap);
    draw_text(hdc,buf,px,py,C_CYAN,hFontSm);

    /* status bar */
    const char* status = done ? "✓ COMPLETE" : (g_running ? "▶ RUNNING" : "⏸ PAUSED");
    COLORREF stat_c = done?C_LIME:(g_running?C_GREEN:C_GREY);
    draw_text(hdc,status,20,10,stat_c,hFontMono);
}

/* ── PAINT: BST ────────────────────────────────────────────────────– */
static void paint_bst(HDC hdc,RECT* rc){
    int n=_bst_count;
    int ox=rc->right/2-320, oy=50;
    
    /* draw edges first */
    for(int i=0;i<n;i++){
        BSTNode* nd=&_bst_nodes[i];
        if(nd->left  !=-1){
            BSTNode* ch=&_bst_nodes[nd->left];
            draw_thick_line(hdc,ox+nd->px,oy+nd->py,ox+ch->px,oy+ch->py,C_GREY,2);
        }
        if(nd->right !=-1){
            BSTNode* ch=&_bst_nodes[nd->right];
            draw_thick_line(hdc,ox+nd->px,oy+nd->py,ox+ch->px,oy+ch->py,C_GREY,2);
        }
    }
    
    /* draw nodes */
    for(int i=0;i<n;i++){
        BSTNode* nd=&_bst_nodes[i];
        draw_circle(hdc,ox+nd->px,oy+nd->py,22,C_PANEL,C_BLUE);
        char buf[8]; sprintf(buf,"%d",nd->value);
        SetBkMode(hdc,TRANSPARENT);
        SetTextColor(hdc,C_CYAN);
        SelectObject(hdc,hFontSm);
        TextOutA(hdc,ox+nd->px-12,oy+nd->py-9,buf,(int)strlen(buf));
    }
    
    /* info */
    draw_text(hdc,"Binary Search Tree (BST)",20,20,C_CYAN,hFontMono);
    draw_text(hdc,"Insert: O(log n) avg | Search: O(log n) avg",20,46,C_TEXT,hFontSm);
}

/* ── PAINT: Red-Black Tree ─────────────────────────────────────────– */
static void paint_rbt(HDC hdc,RECT* rc){
    int n=_rbt_count;
    int ox=rc->right/2-320, oy=50;
    
    /* draw edges first */
    for(int i=0;i<n;i++){
        RBTNode* nd=&_rbt_nodes[i];
        if(nd->left  !=-1){
            RBTNode* ch=&_rbt_nodes[nd->left];
            draw_thick_line(hdc,ox+nd->px,oy+nd->py,ox+ch->px,oy+ch->py,C_GREY,2);
        }
        if(nd->right !=-1){
            RBTNode* ch=&_rbt_nodes[nd->right];
            draw_thick_line(hdc,ox+nd->px,oy+nd->py,ox+ch->px,oy+ch->py,C_GREY,2);
        }
    }
    
    /* draw nodes with color coding */
    for(int i=0;i<n;i++){
        RBTNode* nd=&_rbt_nodes[i];
        COLORREF node_color = nd->color ? C_RBT_BLK : C_RBT_RED;
        COLORREF pen_color = nd->color ? C_GREY : C_RED;
        draw_circle(hdc,ox+nd->px,oy+nd->py,22,node_color,pen_color);
        char buf[8]; sprintf(buf,"%d",nd->value);
        SetBkMode(hdc,TRANSPARENT);
        SetTextColor(hdc,nd->color ? C_LIME : C_YELLOW);
        SelectObject(hdc,hFontSm);
        TextOutA(hdc,ox+nd->px-12,oy+nd->py-9,buf,(int)strlen(buf));
    }
    
    /* info */
    draw_text(hdc,"Red-Black Tree (RBT)",20,20,C_CYAN,hFontMono);
    draw_text(hdc,"Self-balancing BST | Insert/Search: O(log n) guaranteed",20,46,C_TEXT,hFontSm);
    
    /* legend */
    int lx=rc->right-200, ly=20;
    fill_rect(hdc,lx,ly,16,16,C_RBT_RED);
    draw_text(hdc," RED node",lx+20,ly,C_TEXT,hFontSm); ly+=24;
    fill_rect(hdc,lx,ly,16,16,C_RBT_BLK);
    draw_text(hdc," BLACK node",lx+20,ly,C_TEXT,hFontSm);
}

/* ── PAINT: Graph ────────────────────────────────────────────────── */
static void paint_graph(HDC hdc,RECT* rc){
    int ox=(rc->right-rc->left)/2-300;
    int oy=50;
    int cur = (g_graph_algo==0) ? _bfs_cur : _dfs_cur;
    char* vis= (g_graph_algo==0) ? _bfs_visited : _dfs_visited;
    int done = (g_graph_algo==0) ? _bfs_done : _dfs_done;

    /* edges */
    for(int i=0;i<GRAPH_MAX;i++)
        for(int j=i+1;j<GRAPH_MAX;j++)
            if(_graph_adj[i*GRAPH_MAX+j])
                draw_thick_line(hdc,ox+GX[i],oy+GY[i],ox+GX[j],oy+GY[j],C_GREY,2);

    /* nodes */
    for(int i=0;i<GRAPH_MAX;i++){
        COLORREF fill = vis[i] ? C_PURPLE : C_PANEL;
        COLORREF pen  = (i==cur) ? C_YELLOW : C_CYAN;
        draw_circle(hdc,ox+GX[i],oy+GY[i],24,fill,pen);
        char buf[4]; sprintf(buf,"%d",i);
        SetBkMode(hdc,TRANSPARENT);
        SetTextColor(hdc,(i==cur)?C_YELLOW:(vis[i]?C_TEXT:C_CYAN));
        SelectObject(hdc,hFontMono);
        TextOutA(hdc,ox+GX[i]-8,oy+GY[i]-9,buf,(int)strlen(buf));
    }
    
    const char* aname = (g_graph_algo==0) ? "BFS - Breadth First Search" : "DFS - Depth First Search";
    draw_text(hdc,aname,20,20,C_CYAN,hFontMono);
    draw_text(hdc,"Time: O(V+E)   Space: O(V)",20,46,C_TEXT,hFontSm);
    if(done) draw_text(hdc,"✓ TRAVERSAL COMPLETE",20,70,C_LIME,hFontMono);
}

/* ── WM_PAINT ────────────────────────────────────────────────────── */
static void on_paint(HWND hw){
    PAINTSTRUCT ps;
    HDC hdc0=BeginPaint(hw,&ps);
    RECT rc; GetClientRect(hw,&rc);

    /* double-buffer */
    HDC  mem=CreateCompatibleDC(hdc0);
    HBITMAP bmp=CreateCompatibleBitmap(hdc0,rc.right,rc.bottom);
    SelectObject(mem,bmp);

    /* gradient background */
    fill_rect(mem,0,0,rc.right,rc.bottom,C_BG);

    /* content rect */
    RECT cr={0,45,rc.right,rc.bottom-65};
    fill_rect(mem,cr.left,cr.top,cr.right-cr.left,cr.bottom-cr.top,C_ACCENT);

    SetBkMode(mem,TRANSPARENT);

    /* shift origin for content area */
    SetViewportOrgEx(mem,cr.left,cr.top,NULL);
    RECT sr={0,0,cr.right-cr.left,cr.bottom-cr.top};
    switch(g_tab){
        case TAB_SORT:  paint_sort (mem,&sr); break;
        case TAB_TREE:  paint_bst  (mem,&sr); break;
        case TAB_RBT:   paint_rbt  (mem,&sr); break;
        case TAB_GRAPH: paint_graph(mem,&sr); break;
    }
    SetViewportOrgEx(mem,0,0,NULL);

    /* bottom bar with gradient */
    fill_rect(mem,0,rc.bottom-64,rc.right,1,C_GREY);
    fill_rect(mem,0,rc.bottom-63,rc.right,63,C_DARK_GREY);

    /* watermark & version */
    draw_text(mem," AlgoASM v2.0  |  x86-32 ASM + Win32 GUI",
              rc.right-420,rc.bottom-22,C_GREY,hFontSm);

    BitBlt(hdc0,0,0,rc.right,rc.bottom,mem,0,0,SRCCOPY);
    DeleteObject(bmp); DeleteDC(mem);
    EndPaint(hw,&ps);
}

/* ── layout controls ──────────────────────────────────────────────– */
static void layout_controls(HWND hw){
    RECT rc; GetClientRect(hw,&rc);
    int W=rc.right, H=rc.bottom;
    SetWindowPos(hTab,      NULL,0,0,W,40,SWP_NOZORDER);
    SetWindowPos(hAlgo,     NULL,15,H-55,160,28,SWP_NOZORDER);
    SetWindowPos(hTreeType, NULL,185,H-55,140,28,SWP_NOZORDER);
    SetWindowPos(hStart,    NULL,335,H-55,90,28,SWP_NOZORDER);
    SetWindowPos(hReset,    NULL,435,H-55,90,28,SWP_NOZORDER);
    SetWindowPos(hSpeed,    NULL,W-220,H-53,200,24,SWP_NOZORDER);
}

/* ── timer step ──────────────────────────────────────────────────– */
static void do_step(void){
    int done=0;
    switch(g_tab){
        case TAB_SORT:
            switch(g_algo){
                case 0: done=_bubble_step();    break;
                case 1: done=_selection_step(); break;
                case 2: done=_insertion_step(); break;
                case 3: done=_quicksort_step(); break;
                case 4: done=_mergesort_step(); break;
            }
            break;
        case TAB_GRAPH:
            done=(g_graph_algo==0)?_bfs_step():_dfs_step();
            break;
        default: done=1; break;
    }
    if(done){ g_running=FALSE; KillTimer(hWnd,ID_TIMER); }
    InvalidateRect(hWnd,NULL,FALSE);
}

/* ── WndProc ──────────────────────────────────────────────────────– */
static LRESULT CALLBACK WndProc(HWND hw,UINT msg,WPARAM wp,LPARAM lp){
    switch(msg){
    case WM_CREATE:{
        INITCOMMONCONTROLSEX ic={sizeof(ic),ICC_TAB_CLASSES|ICC_BAR_CLASSES};
        InitCommonControlsEx(&ic);
        hFontMono=CreateFontA(16,0,0,0,FW_NORMAL,0,0,0,DEFAULT_CHARSET,
                              OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                              FIXED_PITCH|FF_MODERN,"Consolas");
        hFontBig =CreateFontA(24,0,0,0,FW_BOLD,0,0,0,DEFAULT_CHARSET,
                              OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                              FIXED_PITCH|FF_MODERN,"Consolas");
        hFontSm  =CreateFontA(14,0,0,0,FW_NORMAL,0,0,0,DEFAULT_CHARSET,
                              OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                              FIXED_PITCH|FF_MODERN,"Consolas");
        hFontTitle=CreateFontA(18,0,0,0,FW_BOLD,0,0,0,DEFAULT_CHARSET,
                               OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                               FIXED_PITCH|FF_MODERN,"Consolas");
        
        /* Tab */
        hTab=CreateWindowA(WC_TABCONTROLA,"",WS_CHILD|WS_VISIBLE|TCS_HOTTRACK,
                           0,0,800,40,hw,(HMENU)ID_TAB,NULL,NULL);
        SendMessage(hTab,WM_SETFONT,(WPARAM)hFontMono,TRUE);
        TCITEMA ti={TCIF_TEXT};
        ti.pszText="[ SORT ]";  TabCtrl_InsertItem(hTab,0,&ti);
        ti.pszText="[ BST ]";   TabCtrl_InsertItem(hTab,1,&ti);
        ti.pszText="[ RBT ]";   TabCtrl_InsertItem(hTab,2,&ti);
        ti.pszText="[ GRAPH ]"; TabCtrl_InsertItem(hTab,3,&ti);
        
        /* Algo combo */
        hAlgo=CreateWindowA("COMBOBOX","",
                            WS_CHILD|WS_VISIBLE|CBS_DROPDOWNLIST|WS_VSCROLL,
                            10,0,160,120,hw,(HMENU)ID_ALGO,NULL,NULL);
        SendMessage(hAlgo,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Bubble Sort");
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Selection Sort");
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Insertion Sort");
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Quick Sort");
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Merge Sort");
        SendMessage(hAlgo,CB_SETCURSEL,0,0);
        
        /* Tree Type combo */
        hTreeType=CreateWindowA("COMBOBOX","",
                                WS_CHILD|WS_VISIBLE|CBS_DROPDOWNLIST|WS_VSCROLL,
                                10,0,140,60,hw,(HMENU)ID_TREE_TYPE,NULL,NULL);
        SendMessage(hTreeType,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        SendMessage(hTreeType,CB_ADDSTRING,0,(LPARAM)"BST");
        SendMessage(hTreeType,CB_ADDSTRING,0,(LPARAM)"RBT");
        SendMessage(hTreeType,CB_SETCURSEL,0,0);
        
        /* Buttons */
        hStart=CreateWindowA("BUTTON","▶ START",
                             WS_CHILD|WS_VISIBLE|BS_PUSHBUTTON,
                             0,0,90,28,hw,(HMENU)ID_START,NULL,NULL);
        SendMessage(hStart,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        hReset=CreateWindowA("BUTTON","↺ RESET",
                             WS_CHILD|WS_VISIBLE|BS_PUSHBUTTON,
                             0,0,90,28,hw,(HMENU)ID_RESET,NULL,NULL);
        SendMessage(hReset,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        
        /* Speed slider */
        hSpeed=CreateWindowA(TRACKBAR_CLASSA,"",
                             WS_CHILD|WS_VISIBLE|TBS_HORZ|TBS_NOTICKS,
                             0,0,200,24,hw,(HMENU)ID_SPEED,NULL,NULL);
        SendMessage(hSpeed,TBM_SETRANGE,TRUE,MAKELONG(1,120));
        SendMessage(hSpeed,TBM_SETPOS,  TRUE,g_speed);
        
        /* init data */
        srand((unsigned)time(NULL));
        init_sort();
        init_tree();
        init_graph();
        layout_controls(hw);
        break;}
    case WM_SIZE:
        layout_controls(hw);
        InvalidateRect(hw,NULL,FALSE);
        break;
    case WM_TIMER:
        if(wp==ID_TIMER && g_running) do_step();
        break;
    case WM_HSCROLL:
        if((HWND)lp==hSpeed){
            g_speed=(int)SendMessage(hSpeed,TBM_GETPOS,0,0);
            if(g_running){
                KillTimer(hw,ID_TIMER);
                SetTimer(hw,ID_TIMER,g_speed,NULL);
            }
        }
        break;
    case WM_NOTIFY:{
        NMHDR* nm=(NMHDR*)lp;
        if(nm->idFrom==ID_TAB && nm->code==TCN_SELCHANGE){
            g_tab=TabCtrl_GetCurSel(hTab);
            g_running=FALSE; KillTimer(hw,ID_TIMER);
            SetWindowTextA(hStart,"▶ START");
            
            if(g_tab==TAB_GRAPH){
                SendMessage(hAlgo,CB_RESETCONTENT,0,0);
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"BFS");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"DFS");
                SendMessage(hAlgo,CB_SETCURSEL,g_graph_algo,0);
                ShowWindow(hTreeType,SW_HIDE);
            } else if(g_tab==TAB_SORT){
                SendMessage(hAlgo,CB_RESETCONTENT,0,0);
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Bubble Sort");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Selection Sort");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Insertion Sort");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Quick Sort");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Merge Sort");
                SendMessage(hAlgo,CB_SETCURSEL,g_algo,0);
                ShowWindow(hTreeType,SW_HIDE);
            } else {
                ShowWindow(hTreeType,SW_SHOW);
                SendMessage(hAlgo,CB_RESETCONTENT,0,0);
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Insert Values");
                SendMessage(hAlgo,CB_SETCURSEL,0,0);
            }
            InvalidateRect(hw,NULL,FALSE);
        }
        break;}
    case WM_COMMAND:
        switch(LOWORD(wp)){
        case ID_START:
            if(!g_running){
                g_running=TRUE;
                SetTimer(hw,ID_TIMER,g_speed,NULL);
                SetWindowTextA(hStart,"⏸ PAUSE");
            } else {
                g_running=FALSE;
                KillTimer(hw,ID_TIMER);
                SetWindowTextA(hStart,"▶ START");
            }
            break;
        case ID_RESET:
            g_running=FALSE; KillTimer(hw,ID_TIMER);
            SetWindowTextA(hStart,"▶ START");
            switch(g_tab){
                case TAB_SORT:  init_sort();  break;
                case TAB_TREE:  init_tree();  break;
                case TAB_RBT:   init_tree();  break;
                case TAB_GRAPH: init_graph(); break;
            }
            InvalidateRect(hw,NULL,FALSE);
            break;
        case ID_ALGO:
            if(HIWORD(wp)==CBN_SELCHANGE){
                int sel=(int)SendMessage(hAlgo,CB_GETCURSEL,0,0);
                if(g_tab==TAB_GRAPH){ g_graph_algo=sel; init_graph(); }
                else if(g_tab==TAB_SORT){ g_algo=sel; init_sort(); }
                g_running=FALSE; KillTimer(hw,ID_TIMER);
                SetWindowTextA(hStart,"▶ START");
                InvalidateRect(hw,NULL,FALSE);
            }
            break;
        case ID_TREE_TYPE:
            if(HIWORD(wp)==CBN_SELCHANGE){
                int sel=(int)SendMessage(hTreeType,CB_GETCURSEL,0,0);
                g_tree_type=sel;
                init_tree();
                g_running=FALSE; KillTimer(hw,ID_TIMER);
                SetWindowTextA(hStart,"▶ START");
                InvalidateRect(hw,NULL,FALSE);
            }
            break;
        }
        break;
    case WM_PAINT:
        on_paint(hw);
        return 0;
    case WM_ERASEBKGND:
        return 1;
    case WM_DESTROY:
        KillTimer(hw,ID_TIMER);
        DeleteObject(hFontMono); DeleteObject(hFontBig); DeleteObject(hFontSm); DeleteObject(hFontTitle);
        PostQuitMessage(0);
        break;
    }
    return DefWindowProcA(hw,msg,wp,lp);
}

/* ── WinMain ──────────────────────────────────────────────────────– */
int WINAPI WinMain(HINSTANCE hi,HINSTANCE hp,LPSTR cmd,int show){
    (void)hp;(void)cmd;
    WNDCLASSEXA wc={sizeof(wc)};
    wc.lpfnWndProc  =WndProc;
    wc.hInstance    =hi;
    wc.hCursor      =LoadCursor(NULL,IDC_ARROW);
    wc.hbrBackground=(HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName="AlgoASM";
    wc.hIcon        =LoadIcon(NULL,IDI_APPLICATION);
    RegisterClassExA(&wc);
    hWnd=CreateWindowExA(0,"AlgoASM",
         "AlgoASM v2.0  ─  Algorithm Visualiser  [x86-32 ASM + Win32 GUI]",
         WS_OVERLAPPEDWINDOW,
         CW_USEDEFAULT,CW_USEDEFAULT,1000,700,
         NULL,NULL,hi,NULL);
    ShowWindow(hWnd,show);
    UpdateWindow(hWnd);
    MSG msg;
    while(GetMessageA(&msg,NULL,0,0)){
        TranslateMessage(&msg);
        DispatchMessageA(&msg);
    }
    return (int)msg.wParam;
}
