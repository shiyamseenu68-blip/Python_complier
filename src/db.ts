import { supabase } from './supabase';

export interface DbSnippet { id:string;name:string;content:string;language:string;description:string;is_pinned:boolean;run_count:number;last_run_at:string|null;created_at:string;updated_at:string; }
export interface DbRunHistory { id:string;snippet_id:string|null;code:string;inputs:string[];output:string;exit_code:number;duration_ms:number;error_message:string;created_at:string; }

// Helper to check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export async function fetchSnippets():Promise<DbSnippet[]>{
  if (!isSupabaseConfigured()) return [];
  const{data,error}=await supabase.from('snippets').select('*').order('is_pinned',{ascending:false}).order('updated_at',{ascending:false});
  if(error)throw error;
  return data??[];
}

export async function createSnippet(f:{name:string;content:string;language?:string}):Promise<DbSnippet>{
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const{data,error}=await supabase.from('snippets').insert({name:f.name,content:f.content,language:f.language??'python',description:''}).select().single();
  if(error)throw error;
  return data;
}

export async function updateSnippet(id:string,f:Partial<Pick<DbSnippet,'name'|'content'|'language'|'is_pinned'|'run_count'|'last_run_at'>>):Promise<void>{
  if (!isSupabaseConfigured()) return;
  const{error}=await supabase.from('snippets').update(f).eq('id',id);
  if(error)throw error;
}

export async function deleteSnippet(id:string):Promise<void>{
  if (!isSupabaseConfigured()) return;
  const{error}=await supabase.from('snippets').delete().eq('id',id);
  if(error)throw error;
}

export async function fetchRunHistory(limit=50):Promise<DbRunHistory[]>{
  if (!isSupabaseConfigured()) return [];
  const{data,error}=await supabase.from('run_history').select('*').order('created_at',{ascending:false}).limit(limit);
  if(error)throw error;
  return data??[];
}

export async function insertRunHistory(r:Omit<DbRunHistory,'id'|'created_at'>):Promise<DbRunHistory>{
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const{data,error}=await supabase.from('run_history').insert(r).select().single();
  if(error)throw error;
  return data;
}

export async function deleteRunHistory(id:string):Promise<void>{
  if (!isSupabaseConfigured()) return;
  const{error}=await supabase.from('run_history').delete().eq('id',id);
  if(error)throw error;
}

export async function clearRunHistory():Promise<void>{
  if (!isSupabaseConfigured()) return;
  const{error}=await supabase.from('run_history').delete().gte('created_at','1970-01-01');
  if(error)throw error;
}

export async function loadSetting<T>(key:string,fallback:T):Promise<T>{
  if (!isSupabaseConfigured()) return fallback;
  const{data,error}=await supabase.from('settings').select('value').eq('key',key).maybeSingle();
  if(error||!data)return fallback;
  return data.value as T;
}

export async function saveSetting(key:string,value:unknown):Promise<void>{
  if (!isSupabaseConfigured()) return;
  const{error}=await supabase.from('settings').upsert({key,value},{onConflict:'key'});
  if(error)throw error;
}
