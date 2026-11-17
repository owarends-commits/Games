const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n'))); p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+' '+m.text()); });
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/fonts\.(googleapis|gstatic)/, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html');
  await p.waitForTimeout(4000);
  await p.screenshot({path:'s1.png'});
  const st=await p.evaluate(()=>({mode:MODE, ready:SB.ready, objs:ED.doc&&ED.doc.objects.length, name:ED.doc&&ED.doc.name, boxes:world.boxes.length, cont:world.containers.length, doors:world.doors.length}));
  console.log(JSON.stringify(st));
  await p.click('#vPlan'); await p.waitForTimeout(500); await p.screenshot({path:'s2.png'});
  console.log(errs.slice(0,20).join('\n'));
  await b.close();
})();
