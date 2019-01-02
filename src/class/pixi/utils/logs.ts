type Ilog = (...arg:any[])=>void;
let nativeLog:Ilog = console.log.bind(console);
let emptyLog:Ilog = (...arg:any[])=>{};

const USE_NATIVE_LOG:boolean = true;

export let clog:Ilog = USE_NATIVE_LOG ? nativeLog : emptyLog;