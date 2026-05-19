/* main.c  --  AlgoASM: Algorithm Visualiser (Win32 GUI)
   Calls into sort.asm and tree.asm for algorithm step-functions.
   Compile: gcc -c main.c -o main.obj -m32
   Link:    gcc main.obj sort.obj tree.obj -o AlgoASM.exe
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

typedef struct { int value,left,right,px,py; } BSTNode;
extern BSTNode _bst_nodes[];
extern int     _bst_count;
extern void __cdecl _bst_clear (void);
extern void __cdecl _bst_insert(int);

extern char _graph_adj[];       /* GRAPH_MAX x GRAPH_MAX  */
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
#define ID_TIMER  1
#define TAB_SORT  0
#define TAB_TREE  1
#define TAB_GRAPH 2

/* ── palette ─────────────────────────────────────────────────────── */
#define C_BG       RGB(10,12,16)
#define C_PANEL    RGB(16,20,28)
#define C_GREEN    RGB(0,230,90)
#define C_DIM      RGB(0,130,50)
#define C_ORANGE   RGB(255,120,30)
#define C_BLUE     RGB(60,160,255)
#define C_PURPLE   RGB(160,80,255)
#define C_TEXT     RGB(200,220,200)
#define C_GREY     RGB(70,80,90)
#define C_RED      RGB(230,50,60)

/* ── graph node positions (pre-laid out) ─────────────────────────── */
static const int GX[GRAPH_MAX] = {300,180,420,100,260,480,100,260,480};
static const int GY[GRAPH_MAX] = { 60,160,160,260,260,260,360,360,360};

/* ── complexity strings ──────────────────────────────────────────── */
static const char* SORT_NAMES[3] = {"Bubble Sort","Selection Sort","Insertion Sort"};
static const char* SORT_BEST [3] = {"O(n)","O(n²)","O(n)"};
static const char* SORT_AVG  [3] = {"O(n²)","O(n²)","O(n²)"};
static const char* SORT_WORST[3] = {"O(n²)","O(n²)","O(n²)"};
static const char* SORT_SPACE[3] = {"O(1)","O(1)","O(1)"};

/* ── globals ─────────────────────────────────────────────────────── */
static HWND  hWnd, hTab, hStart, hReset, hSpeed, hAlgo;
static int   g_tab=TAB_SORT, g_algo=0, g_speed=30;
static BOOL  g_running=FALSE;
static int   g_sort[SORT_N];
static int   g_graph_algo=0; /* 0=BFS 1=DFS */
static int   g_bst_vals[]={50,30,70,20,40,60,80,10,25};
#define BST_SEED_N 9

/* ── helpers ─────────────────────────────────────────────────────── */
static void shuffle_sort(void){
    for(int i=0;i<SORT_N;i++) g_sort[i]=i+1;
    for(int i=SORT_N-1;i>0;i--){
        int j=rand()%(i+1);
        int t=g_sort[i]; g_sort[i]=g_sort[j]; g_sort[j]=t;
    }
}
static void init_sort(void){
    shuffle_sort();
    switch(g_algo){
        case 0: _bubble_init   (g_sort,SORT_N); break;
        case 1: _selection_init(g_sort,SORT_N); break;
        case 2: _insertion_init(g_sort,SORT_N); break;
    }
}
static void init_tree(void){
    _bst_clear();
    for(int i=0;i<BST_SEED_N;i++) _bst_insert(g_bst_vals[i]);
}
static void init_graph(void){
    if(g_graph_algo==0) _bfs_init(0);
    else                _dfs_init(0);
}

/* ── GDI helpers ─────────────────────────────────────────────────── */
static HFONT hFontMono, hFontBig, hFontSm;

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

/* ── PAINT: Sorting bars ─────────────────────────────────────────── */
static void paint_sort(HDC hdc,RECT* rc){
    int cmpA=_cmp_a, cmpB=_cmp_b, done=_sort_done;
    int panW=rc->right-rc->left-220;
    int panH=rc->bottom-rc->top-80;
    int barW=(panW-20)/SORT_N;
    int barMax=panH-40;

    for(int i=0;i<SORT_N;i++){
        int h=(int)((float)g_sort[i]/SORT_N * barMax);
        int x=10+i*barW;
        int y=panH-h+30;
        COLORREF c;
        if(done)              c=C_PURPLE;
        else if(i==cmpA)      c=C_ORANGE;
        else if(i==cmpB)      c=C_RED;
        else                  c=C_GREEN;
        fill_rect(hdc,x,y,barW-2,h,c);
    }
    /* complexity panel */
    int px=panW+10, py=60;
    draw_text(hdc,"COMPLEXITY",px,py,C_BLUE,hFontMono); py+=24;
    draw_line(hdc,px,py,px+180,py,C_GREY); py+=8;
    char buf[64];
    sprintf(buf,"Best:  %s",SORT_BEST [g_algo]); draw_text(hdc,buf,px,py,C_TEXT,hFontSm); py+=20;
    sprintf(buf,"Avg:   %s",SORT_AVG  [g_algo]); draw_text(hdc,buf,px,py,C_TEXT,hFontSm); py+=20;
    sprintf(buf,"Worst: %s",SORT_WORST[g_algo]); draw_text(hdc,buf,px,py,C_TEXT,hFontSm); py+=20;
    sprintf(buf,"Space: %s",SORT_SPACE[g_algo]); draw_text(hdc,buf,px,py,C_TEXT,hFontSm); py+=30;
    draw_text(hdc,"LEGEND",px,py,C_BLUE,hFontMono); py+=20;
    fill_rect(hdc,px,py,12,12,C_ORANGE); draw_text(hdc," Compare A",px+14,py,C_TEXT,hFontSm); py+=18;
    fill_rect(hdc,px,py,12,12,C_RED);    draw_text(hdc," Compare B",px+14,py,C_TEXT,hFontSm); py+=18;
    fill_rect(hdc,px,py,12,12,C_PURPLE); draw_text(hdc," Sorted",   px+14,py,C_TEXT,hFontSm); py+=18;
    fill_rect(hdc,px,py,12,12,C_GREEN);  draw_text(hdc," Default",  px+14,py,C_TEXT,hFontSm);

    /* status */
    const char* status = done ? "; DONE" : (g_running ? "; RUNNING" : "; PAUSED");
    draw_text(hdc,status,10,10,done?C_PURPLE:(g_running?C_GREEN:C_GREY),hFontMono);
}

/* ── PAINT: BST ──────────────────────────────────────────────────── */
static void paint_tree(HDC hdc,RECT* rc){
    int n=_bst_count;
    int ox=rc->right/2-300, oy=30;
    /* draw edges first */
    for(int i=0;i<n;i++){
        BSTNode* nd=&_bst_nodes[i];
        if(nd->left  !=-1){
            BSTNode* ch=&_bst_nodes[nd->left];
            draw_line(hdc,ox+nd->px,oy+nd->py,ox+ch->px,oy+ch->py,C_DIM);
        }
        if(nd->right !=-1){
            BSTNode* ch=&_bst_nodes[nd->right];
            draw_line(hdc,ox+nd->px,oy+nd->py,ox+ch->px,oy+ch->py,C_DIM);
        }
    }
    /* draw nodes */
    for(int i=0;i<n;i++){
        BSTNode* nd=&_bst_nodes[i];
        draw_circle(hdc,ox+nd->px,oy+nd->py,18,C_PANEL,C_GREEN);
        char buf[8]; sprintf(buf,"%d",nd->value);
        SetBkMode(hdc,TRANSPARENT);
        SetTextColor(hdc,C_GREEN);
        SelectObject(hdc,hFontSm);
        TextOutA(hdc,ox+nd->px-10,oy+nd->py-8,buf,(int)strlen(buf));
    }
    /* info */
    draw_text(hdc,"Binary Search Tree",10,10,C_BLUE,hFontMono);
    draw_text(hdc,"Insert: O(log n) avg | O(n) worst",10,34,C_TEXT,hFontSm);
    draw_text(hdc,"Search: O(log n) avg | O(n) worst",10,52,C_TEXT,hFontSm);
}

/* ── PAINT: Graph ────────────────────────────────────────────────── */
static void paint_graph(HDC hdc,RECT* rc){
    int ox=(rc->right-rc->left)/2-300;
    int oy=30;
    int cur = (g_graph_algo==0) ? _bfs_cur : _dfs_cur;
    char* vis= (g_graph_algo==0) ? _bfs_visited : _dfs_visited;
    int done = (g_graph_algo==0) ? _bfs_done : _dfs_done;

    /* edges */
    for(int i=0;i<GRAPH_MAX;i++)
        for(int j=i+1;j<GRAPH_MAX;j++)
            if(_graph_adj[i*GRAPH_MAX+j])
                draw_line(hdc,ox+GX[i],oy+GY[i],ox+GX[j],oy+GY[j],C_GREY);

    /* nodes */
    for(int i=0;i<GRAPH_MAX;i++){
        COLORREF fill = vis[i] ? C_PURPLE : C_PANEL;
        COLORREF pen  = (i==cur) ? C_ORANGE : C_GREEN;
        draw_circle(hdc,ox+GX[i],oy+GY[i],20,fill,pen);
        char buf[4]; sprintf(buf,"%d",i);
        SetBkMode(hdc,TRANSPARENT);
        SetTextColor(hdc,(i==cur)?C_ORANGE:(vis[i]?C_TEXT:C_GREEN));
        SelectObject(hdc,hFontMono);
        TextOutA(hdc,ox+GX[i]-6,oy+GY[i]-8,buf,(int)strlen(buf));
    }
    const char* aname = (g_graph_algo==0) ? "BFS - Breadth First Search" : "DFS - Depth First Search";
    draw_text(hdc,aname,10,10,C_BLUE,hFontMono);
    draw_text(hdc,"Time: O(V+E)   Space: O(V)",10,34,C_TEXT,hFontSm);
    if(done) draw_text(hdc,"; TRAVERSAL COMPLETE",10,52,C_PURPLE,hFontSm);
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

    /* background */
    fill_rect(mem,0,0,rc.right,rc.bottom,C_BG);

    /* content rect below tab + above controls */
    RECT cr={0,40,rc.right,rc.bottom-60};
    fill_rect(mem,cr.left,cr.top,cr.right-cr.left,cr.bottom-cr.top,C_PANEL);

    SetBkMode(mem,TRANSPARENT);

    /* shift origin for content area */
    SetViewportOrgEx(mem,cr.left,cr.top,NULL);
    RECT sr={0,0,cr.right-cr.left,cr.bottom-cr.top};
    switch(g_tab){
        case TAB_SORT:  paint_sort (mem,&sr); break;
        case TAB_TREE:  paint_tree (mem,&sr); break;
        case TAB_GRAPH: paint_graph(mem,&sr); break;
    }
    SetViewportOrgEx(mem,0,0,NULL);

    /* bottom bar */
    fill_rect(mem,0,rc.bottom-58,rc.right,2,C_GREY);

    /* watermark */
    draw_text(mem," AlgoASM v1.0  |  NASM x86 + Win32",
              rc.right-330,rc.bottom-22,C_GREY,hFontSm);

    BitBlt(hdc0,0,0,rc.right,rc.bottom,mem,0,0,SRCCOPY);
    DeleteObject(bmp); DeleteDC(mem);
    EndPaint(hw,&ps);
}

/* ── layout controls ─────────────────────────────────────────────── */
static void layout_controls(HWND hw){
    RECT rc; GetClientRect(hw,&rc);
    int W=rc.right, H=rc.bottom;
    SetWindowPos(hTab,  NULL,0,0,W,40,SWP_NOZORDER);
    SetWindowPos(hAlgo, NULL,10,H-50,140,28,SWP_NOZORDER);
    SetWindowPos(hStart,NULL,160,H-50,80,28,SWP_NOZORDER);
    SetWindowPos(hReset,NULL,250,H-50,80,28,SWP_NOZORDER);
    SetWindowPos(hSpeed,NULL,W-210,H-48,180,24,SWP_NOZORDER);
}

/* ── timer step ──────────────────────────────────────────────────── */
static void do_step(void){
    int done=0;
    switch(g_tab){
        case TAB_SORT:
            switch(g_algo){
                case 0: done=_bubble_step();    break;
                case 1: done=_selection_step(); break;
                case 2: done=_insertion_step(); break;
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

/* ── WndProc ─────────────────────────────────────────────────────── */
static LRESULT CALLBACK WndProc(HWND hw,UINT msg,WPARAM wp,LPARAM lp){
    switch(msg){
    case WM_CREATE:{
        INITCOMMONCONTROLSEX ic={sizeof(ic),ICC_TAB_CLASSES|ICC_BAR_CLASSES};
        InitCommonControlsEx(&ic);
        hFontMono=CreateFontA(16,0,0,0,FW_NORMAL,0,0,0,DEFAULT_CHARSET,
                              OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                              FIXED_PITCH|FF_MODERN,"Consolas");
        hFontBig =CreateFontA(22,0,0,0,FW_BOLD,0,0,0,DEFAULT_CHARSET,
                              OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                              FIXED_PITCH|FF_MODERN,"Consolas");
        hFontSm  =CreateFontA(14,0,0,0,FW_NORMAL,0,0,0,DEFAULT_CHARSET,
                              OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY,
                              FIXED_PITCH|FF_MODERN,"Consolas");
        /* Tab */
        hTab=CreateWindowA(WC_TABCONTROLA,"",WS_CHILD|WS_VISIBLE|TCS_HOTTRACK,
                           0,0,800,40,hw,(HMENU)ID_TAB,NULL,NULL);
        SendMessage(hTab,WM_SETFONT,(WPARAM)hFontMono,TRUE);
        TCITEMA ti={TCIF_TEXT};
        ti.pszText="[ SORT ]";  TabCtrl_InsertItem(hTab,0,&ti);
        ti.pszText="[ TREE ]";  TabCtrl_InsertItem(hTab,1,&ti);
        ti.pszText="[ GRAPH ]"; TabCtrl_InsertItem(hTab,2,&ti);
        /* Algo combo */
        hAlgo=CreateWindowA("COMBOBOX","",
                            WS_CHILD|WS_VISIBLE|CBS_DROPDOWNLIST|WS_VSCROLL,
                            10,0,140,120,hw,(HMENU)ID_ALGO,NULL,NULL);
        SendMessage(hAlgo,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Bubble Sort");
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Selection Sort");
        SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Insertion Sort");
        SendMessage(hAlgo,CB_SETCURSEL,0,0);
        /* Buttons */
        hStart=CreateWindowA("BUTTON","► START",
                             WS_CHILD|WS_VISIBLE|BS_PUSHBUTTON,
                             0,0,80,28,hw,(HMENU)ID_START,NULL,NULL);
        SendMessage(hStart,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        hReset=CreateWindowA("BUTTON","↺ RESET",
                             WS_CHILD|WS_VISIBLE|BS_PUSHBUTTON,
                             0,0,80,28,hw,(HMENU)ID_RESET,NULL,NULL);
        SendMessage(hReset,WM_SETFONT,(WPARAM)hFontSm,TRUE);
        /* Speed slider */
        hSpeed=CreateWindowA(TRACKBAR_CLASSA,"",
                             WS_CHILD|WS_VISIBLE|TBS_HORZ|TBS_NOTICKS,
                             0,0,180,24,hw,(HMENU)ID_SPEED,NULL,NULL);
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
            /* update combo for graph tab */
            if(g_tab==TAB_GRAPH){
                SendMessage(hAlgo,CB_RESETCONTENT,0,0);
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"BFS");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"DFS");
                SendMessage(hAlgo,CB_SETCURSEL,g_graph_algo,0);
            } else {
                SendMessage(hAlgo,CB_RESETCONTENT,0,0);
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Bubble Sort");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Selection Sort");
                SendMessage(hAlgo,CB_ADDSTRING,0,(LPARAM)"Insertion Sort");
                SendMessage(hAlgo,CB_SETCURSEL,g_algo,0);
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
                SetWindowTextA(hStart,"‖ PAUSE");
            } else {
                g_running=FALSE;
                KillTimer(hw,ID_TIMER);
                SetWindowTextA(hStart,"► START");
            }
            break;
        case ID_RESET:
            g_running=FALSE; KillTimer(hw,ID_TIMER);
            SetWindowTextA(hStart,"► START");
            switch(g_tab){
                case TAB_SORT:  init_sort();  break;
                case TAB_TREE:  init_tree();  break;
                case TAB_GRAPH: init_graph(); break;
            }
            InvalidateRect(hw,NULL,FALSE);
            break;
        case ID_ALGO:
            if(HIWORD(wp)==CBN_SELCHANGE){
                int sel=(int)SendMessage(hAlgo,CB_GETCURSEL,0,0);
                if(g_tab==TAB_GRAPH){ g_graph_algo=sel; init_graph(); }
                else                { g_algo=sel;       init_sort();  }
                g_running=FALSE; KillTimer(hw,ID_TIMER);
                SetWindowTextA(hStart,"► START");
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
        DeleteObject(hFontMono); DeleteObject(hFontBig); DeleteObject(hFontSm);
        PostQuitMessage(0);
        break;
    }
    return DefWindowProcA(hw,msg,wp,lp);
}

/* ── WinMain ─────────────────────────────────────────────────────── */
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
         "AlgoASM  ─  Algorithm Visualiser  [NASM x86 + Win32]",
         WS_OVERLAPPEDWINDOW,
         CW_USEDEFAULT,CW_USEDEFAULT,900,600,
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
