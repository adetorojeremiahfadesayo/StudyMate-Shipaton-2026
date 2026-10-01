import { useEffect, useRef, useState } from 'react';
import { api } from './lib';
export default function StudyTimer({sessionId,targetMinutes}:{sessionId:string;targetMinutes:number}) {
  const [seconds,setSeconds]=useState(0),[state,setState]=useState('paused'),[reason,setReason]=useState(''),[error,setError]=useState('');
  const interaction=useRef(Date.now()),sequence=useRef(Date.now()),running=useRef(false),sending=useRef(false);
  async function event(action:'heartbeat'|'pause'|'finish',pauseReason?:string) {
    if(sending.current)return; sending.current=true;
    try {
      const result=await api<{active_seconds:number;state:string}>('/api/schools/timer',{studySessionId:sessionId,sequence:++sequence.current,action,reason:pauseReason});
      setSeconds(result.active_seconds);setState(result.state);running.current=result.state==='active';setError('');
    } catch(e){running.current=false;setState('paused');setError(e instanceof Error?e.message:'Timer connection failed.');} finally{sending.current=false;}
  }
  useEffect(()=>{
    running.current=false;interaction.current=Date.now();
    const interact=()=>{interaction.current=Date.now();};
    const visible=()=>{if(document.hidden&&running.current){running.current=false;void event('pause','App moved to background');}};
    document.addEventListener('pointerdown',interact);document.addEventListener('keydown',interact);document.addEventListener('scroll',interact,true);document.addEventListener('visibilitychange',visible);
    const interval=setInterval(()=>{if(running.current){if(document.hidden||Date.now()-interaction.current>60_000){running.current=false;void event('pause','Inactive or background');}else void event('heartbeat');}},20_000);
    return()=>{clearInterval(interval);document.removeEventListener('pointerdown',interact);document.removeEventListener('keydown',interact);document.removeEventListener('scroll',interact,true);document.removeEventListener('visibilitychange',visible);if(running.current){running.current=false;void event('pause','Left assigned session');}};
  },[sessionId]);
  return <section className="card timer"><h2>Assigned study timer</h2><p><strong>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong> active time · target {targetMinutes} minutes · {state}</p><p className="hint">Your teacher sees this assignment's active minutes and practice result. This measures app activity, not whether you read or understood. Personal study is separate.</p>{error&&<p role="alert">{error}</p>}{state!=='completed'&&<><button onClick={()=>{interaction.current=Date.now();void event('heartbeat');}}>Start / resume timer</button><label>Reason for pause<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={200}/></label><button className="secondary" disabled={!reason.trim()} onClick={()=>void event('pause',reason)}>Pause</button><button disabled={seconds<targetMinutes*60} onClick={()=>void event('finish')}>Finish assignment</button><p className="hint">Finishing also requires a submitted practice set.</p></>}</section>;
}
