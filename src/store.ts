import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LineType, RunSignal } from './runner';
import type { DbSnippet, DbRunHistory } from './db';
import { fetchSnippets, createSnippet, updateSnippet, deleteSnippet, fetchRunHistory, insertRunHistory, deleteRunHistory, clearRunHistory, loadSetting, saveSetting } from './db';

export interface FNode { id:string;name:string;type:'file'|'folder';parentId:string|null;content?:string;language?:string;isOpen?:boolean;isDirty?:boolean;snippetId?:string; }
export interface Tab   { id:string;fileId:string;name:string;language:string;isDirty:boolean; }
export interface TLine { id:string;type:LineType;text:string; }
export interface Notif { id:string;level:'success'|'error'|'info'|'warning';title:string;msg?:string; }
export interface Cfg   { theme:string;accent:string;font:string;fontSize:number;lineHeight:number;fontLigatures:boolean;wordWrap:boolean;minimap:boolean;lineNumbers:boolean;tabSize:number;autoSave:boolean;bracketPairs:boolean;cursorBlink:string;cursorStyle:string;folding:boolean;smoothScroll:boolean;quickSuggest:boolean;zoom:number;termFont:number; }
export const DEF_CFG:Cfg={theme:'tokyo-night',accent:'#7aa2f7',font:'JetBrains Mono',fontSize:14,lineHeight:22,fontLigatures:true,wordWrap:true,minimap:true,lineNumbers:true,tabSize:4,autoSave:true,bracketPairs:true,cursorBlink:'smooth',cursorStyle:'line',folding:true,smoothScroll:true,quickSuggest:true,zoom:100,termFont:13};

const WELCOME=`# Python Studio · Ctrl+Enter to run
# ─────────────────────────────────────

name = input("Your name: ")
age  = int(input("Your age: "))
print(f"Hello {name}, you are {age}!")

def fib(n): return n if n<=1 else fib(n-1)+fib(n-2)
print("Fib(8):", fib(8))

class Animal:
    def __init__(self, name): self.name = name
    def speak(self): return f"{self.name} says hello"

print(Animal("Dog").speak())

try:
    x = 10 / 0
except ZeroDivisionError as e:
    print(f"Caught: {e}")
`;

let _n=0;
const uid=()=>`_${++_n}${Math.random().toString(36).slice(2,5)}`;
const langOf=(n:string)=>({py:'python',js:'javascript',ts:'typescript',html:'html',css:'css',json:'json',md:'markdown'} as any)[n.split('.').pop()?.toLowerCase()??'']??'plaintext';
const F0:FNode={id:uid(),name:'main.py',type:'file',parentId:null,content:WELCOME,language:'python',isDirty:false};

interface S {
  files:FNode[];tabs:Tab[];activeTabId:string|null;activeFileId:string|null;
  lines:TLine[];running:boolean;inputPrompt:string|null;inputResolve:((v:string)=>void)|null;
  cfg:Cfg;sidebarOpen:boolean;sidebarW:number;termOpen:boolean;termH:number;
  showCfg:boolean;showExport:boolean;showCmd:boolean;showHistory:boolean;showSnippets:boolean;
  mobileView:'editor'|'term';mobileNav:boolean;
  search:string;hits:{fileId:string;file:string;line:number;text:string}[];notifs:Notif[];
  runSignal:RunSignal;dbSnippets:DbSnippet[];dbHistory:DbRunHistory[];dbLoading:boolean;
  stdin:string;
  openFile(id:string):void;closeTab(id:string):void;setActiveTab(id:string):void;
  updateContent(id:string,c:string):void;createFile(n:string,p?:string|null):void;
  createFolder(n:string,p?:string|null):void;deleteNode(id:string):void;
  renameNode(id:string,n:string):void;toggleFolder(id:string):void;saveAll():void;
  uploadFiles(fs:File[]):void;importFiles(es:{name:string;content:string}[]):void;
  downloadFile(id:string):void;activeFile():FNode|undefined;
  addLine(t:LineType,s:string):void;clearLines():void;setRunning(v:boolean):void;
  requestInput(p:string):Promise<string>;resolveInput(v:string):void;
  toggleSidebar():void;setSidebarW(w:number):void;setTermOpen(v:boolean):void;setTermH(h:number):void;
  setShowCfg(v:boolean):void;setShowExport(v:boolean):void;setShowCmd(v:boolean):void;
  setShowHistory(v:boolean):void;setShowSnippets(v:boolean):void;
  setMobileView(v:'editor'|'term'):void;setMobileNav(v:boolean):void;
  setSearch(q:string):void;runSearch():void;updateCfg(p:Partial<Cfg>):void;
  notify(n:Omit<Notif,'id'>):void;dismiss(id:string):void;
  zoomIn():void;zoomOut():void;resetZoom():void;
  loadDb():Promise<void>;saveSnippetFromFile(fileId:string):Promise<void>;
  loadSnippetToEditor(s:DbSnippet):void;removeSnippet(id:string):Promise<void>;
  togglePin(id:string):Promise<void>;
  recordRun(snId:string|null,code:string,inputs:string[],output:string,exitCode:number,ms:number,err:string):Promise<void>;
  removeHistory(id:string):Promise<void>;wipeHistory():Promise<void>;
  setStdin(v:string):void;
}

export const useStore=create<S>()(persist((set,get)=>({
  files:[F0],tabs:[],activeTabId:null,activeFileId:null,
  lines:[],running:false,inputPrompt:null,inputResolve:null,
  cfg:DEF_CFG,sidebarOpen:true,sidebarW:240,termOpen:false,termH:280,
  showCfg:false,showExport:false,showCmd:false,showHistory:false,showSnippets:false,
  mobileView:'editor',mobileNav:false,
  search:'',hits:[],notifs:[],runSignal:{aborted:false},
  dbSnippets:[],dbHistory:[],dbLoading:false,
  stdin:'',
  openFile(id){const f=get().files.find(x=>x.id===id);if(!f||f.type!=='file')return;const ex=get().tabs.find(t=>t.fileId===id);if(ex){set({activeTabId:ex.id,activeFileId:id});return;}const t:Tab={id:uid(),fileId:id,name:f.name,language:f.language??'plaintext',isDirty:false};set(s=>({tabs:[...s.tabs,t],activeTabId:t.id,activeFileId:id}));},
  closeTab(tabId){const ts=get().tabs,i=ts.findIndex(t=>t.id===tabId);if(i===-1)return;const nt=ts.filter(t=>t.id!==tabId),nx=nt[i]??nt[i-1]??null;set({tabs:nt,activeTabId:nx?.id??null,activeFileId:nx?.fileId??null});},
  setActiveTab(id){const t=get().tabs.find(t=>t.id===id);set({activeTabId:id,activeFileId:t?.fileId??null});},
  updateContent(id,c){set(s=>({files:s.files.map(f=>f.id===id?{...f,content:c,isDirty:!s.cfg.autoSave}:f),tabs:s.tabs.map(t=>t.fileId===id?{...t,isDirty:!s.cfg.autoSave}:t)}));},
  createFile(n,p=null){const id=uid();set(s=>({files:[...s.files,{id,name:n,type:'file',parentId:p,content:'',language:langOf(n),isDirty:false}]}));get().openFile(id);},
  createFolder(n,p=null){set(s=>({files:[...s.files,{id:uid(),name:n,type:'folder',parentId:p,isOpen:true}]}));},
  deleteNode(id){const del=new Set([id]);let ch=true;while(ch){ch=false;get().files.forEach(f=>{if(f.parentId&&del.has(f.parentId)&&!del.has(f.id)){del.add(f.id);ch=true;}});}const nf=get().files.filter(f=>!del.has(f.id)),nt=get().tabs.filter(t=>!del.has(t.fileId));const nx=nt.find(t=>t.id===get().activeTabId)??nt[nt.length-1]??null;set({files:nf,tabs:nt,activeTabId:nx?.id??null,activeFileId:nx?.fileId??null});},
  renameNode(id,n){const l=langOf(n);set(s=>({files:s.files.map(f=>f.id===id?{...f,name:n,...(f.type==='file'?{language:l}:{})}:f),tabs:s.tabs.map(t=>t.fileId===id?{...t,name:n,language:l}:t)}));},
  toggleFolder(id){set(s=>({files:s.files.map(f=>f.id===id?{...f,isOpen:!f.isOpen}:f)}));},
  saveAll(){set(s=>({files:s.files.map(f=>({...f,isDirty:false})),tabs:s.tabs.map(t=>({...t,isDirty:false}))}));},
  uploadFiles(fs){fs.forEach(f=>{const r=new FileReader();r.onload=e=>{const id=uid();set(s=>({files:[...s.files,{id,name:f.name,type:'file',parentId:null,content:(e.target?.result as string)??'',language:langOf(f.name),isDirty:false}]}));get().openFile(id);};r.readAsText(f);});get().notify({level:'success',title:`Uploaded ${fs.length} file(s)`});},
  importFiles(es){es.forEach(e=>{const id=uid();set(s=>({files:[...s.files,{id,name:e.name,type:'file',parentId:null,content:e.content,language:langOf(e.name),isDirty:false}]}));get().openFile(id);});get().notify({level:'success',title:`Imported ${es.length} file(s)`});},
  downloadFile(id){const f=get().files.find(x=>x.id===id);if(!f)return;const u=URL.createObjectURL(new Blob([f.content??'']));Object.assign(document.createElement('a'),{href:u,download:f.name}).click();URL.revokeObjectURL(u);},
  activeFile:()=>get().files.find(f=>f.id===get().activeFileId),
  addLine(t,s){set(st=>({lines:[...st.lines.slice(-5000),{id:uid(),type:t,text:s}]}));},
  clearLines(){set({lines:[]});},
  setRunning(v){set({running:v});},
  requestInput(p){return new Promise(res=>set({inputPrompt:p,inputResolve:res}));},
  resolveInput(v){const fn=get().inputResolve;if(fn)fn(v);set({inputPrompt:null,inputResolve:null});},
  toggleSidebar(){set(s=>({sidebarOpen:!s.sidebarOpen}));},
  setSidebarW(w){set({sidebarW:Math.max(160,Math.min(500,w))});},
  setTermOpen(v){set({termOpen:v});},setTermH(h){set({termH:Math.max(80,Math.min(640,h))});},
  setShowCfg(v){set({showCfg:v});},setShowExport(v){set({showExport:v});},setShowCmd(v){set({showCmd:v});},
  setShowHistory(v){set({showHistory:v});},setShowSnippets(v){set({showSnippets:v});},
  setMobileView(v){set({mobileView:v});},setMobileNav(v){set({mobileNav:v});},
  setSearch(q){set({search:q});},
  runSearch(){const q=get().search.toLowerCase().trim();if(!q){set({hits:[]});return;}const h:S['hits']=[];get().files.forEach(f=>{if(f.type!=='file'||!f.content)return;f.content.split('\n').forEach((l,i)=>{if(l.toLowerCase().includes(q))h.push({fileId:f.id,file:f.name,line:i+1,text:l.trim().slice(0,100)});});});set({hits:h.slice(0,200)});},
  updateCfg(p){set(s=>({cfg:{...s.cfg,...p}}));saveSetting('editor_config',{...get().cfg,...p}).catch(()=>{});},
  notify(n){const id=uid();set(s=>({notifs:[...s.notifs,{...n,id}]}));setTimeout(()=>get().dismiss(id),4500);},
  dismiss(id){set(s=>({notifs:s.notifs.filter(n=>n.id!==id)}));},
  zoomIn(){set(s=>({cfg:{...s.cfg,zoom:Math.min(300,s.cfg.zoom+10)}}));},
  zoomOut(){set(s=>({cfg:{...s.cfg,zoom:Math.max(50,s.cfg.zoom-10)}}));},
  resetZoom(){set(s=>({cfg:{...s.cfg,zoom:100}}));},
  async loadDb(){set({dbLoading:true});try{const[snippets,history,savedCfg]=await Promise.all([fetchSnippets(),fetchRunHistory(100),loadSetting<Cfg|null>('editor_config',null)]);set({dbSnippets:snippets,dbHistory:history,...(savedCfg?{cfg:{...DEF_CFG,...savedCfg}}:{}),dbLoading:false});}catch{set({dbLoading:false});}},
  async saveSnippetFromFile(fileId){const f=get().files.find(x=>x.id===fileId);if(!f||f.type!=='file')return;try{if(f.snippetId){await updateSnippet(f.snippetId,{name:f.name,content:f.content??'',language:f.language??'python'});get().notify({level:'success',title:'Snippet updated'});}else{const sn=await createSnippet({name:f.name,content:f.content??'',language:f.language??'python'});set(s=>({dbSnippets:[sn,...s.dbSnippets],files:s.files.map(file=>file.id===fileId?{...file,snippetId:sn.id}:file)}));get().notify({level:'success',title:'Saved',msg:f.name});}}catch(e:any){get().notify({level:'error',title:'Save failed',msg:e?.message});}},
  loadSnippetToEditor(s){const id=uid();set(st=>({files:[...st.files,{id,name:s.name,type:'file',parentId:null,content:s.content,language:s.language,isDirty:false,snippetId:s.id}]}));get().openFile(id);},
  async removeSnippet(id){try{await deleteSnippet(id);set(s=>({dbSnippets:s.dbSnippets.filter(sn=>sn.id!==id)}));get().notify({level:'success',title:'Deleted'});}catch(e:any){get().notify({level:'error',title:'Failed',msg:e?.message});}},
  async togglePin(id){const sn=get().dbSnippets.find(s=>s.id===id);if(!sn)return;const v=!sn.is_pinned;try{await updateSnippet(id,{is_pinned:v});set(s=>({dbSnippets:s.dbSnippets.map(x=>x.id===id?{...x,is_pinned:v}:x)}));}catch{}},
  async recordRun(snId,code,inputs,output,exitCode,ms,err){if(snId){const sn=get().dbSnippets.find(s=>s.id===snId);if(sn){const nc=sn.run_count+1;updateSnippet(snId,{run_count:nc,last_run_at:new Date().toISOString()}).catch(()=>{});set(s=>({dbSnippets:s.dbSnippets.map(x=>x.id===snId?{...x,run_count:nc}:x)}));}}try{const row=await insertRunHistory({snippet_id:snId,code,inputs,output,exit_code:exitCode,duration_ms:ms,error_message:err});set(s=>({dbHistory:[row,...s.dbHistory].slice(0,200)}));}catch{}},
  async removeHistory(id){try{await deleteRunHistory(id);set(s=>({dbHistory:s.dbHistory.filter(h=>h.id!==id)}));}catch(e:any){get().notify({level:'error',title:'Failed',msg:e?.message});}},
  async wipeHistory(){try{await clearRunHistory();set({dbHistory:[]});get().notify({level:'success',title:'History cleared'});}catch(e:any){get().notify({level:'error',title:'Failed',msg:e?.message});}},
  setStdin(v){set({stdin:v});},
}),{name:'pystudio-v12',partialize:s=>({files:s.files,sidebarW:s.sidebarW,termH:s.termH,sidebarOpen:s.sidebarOpen})}));
