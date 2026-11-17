const { chromium } = require('playwright');
(async()=>{ for(const args of [['--use-gl=swiftshader'],['--use-angle=swiftshader','--enable-unsafe-swiftshader'],[]]){ const b=await chromium.launch({args}); const p=await b.newPage();
 console.log(args.join(' '), await p.evaluate(()=>!!document.createElement('canvas').getContext('webgl'))); await b.close(); } })();
