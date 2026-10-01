import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
let uid,browser;const email=`mobile-ui-${randomUUID()}@example.com`,password=randomUUID()+randomUUID();
try {
  const created=await db.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;uid=created.data.user.id;
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(process.env.MOBILE_TEST_ORIGIN||'http://127.0.0.1:4180');
  await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('heading',{name:'Your courses'}).waitFor();await page.getByText(/3 of 3 monthly sessions remaining/).waitFor();
  await page.getByLabel('Course name',{exact:true}).fill('Synthetic browser course');await page.getByRole('button',{name:'Create course',exact:true}).click();
  await page.getByRole('heading',{name:'Synthetic browser course',exact:true}).waitFor();
  await page.getByRole('button',{name:'Courses',exact:true}).click();await page.getByRole('button',{name:'Archive',exact:true}).click();await page.getByRole('button',{name:'Reactivate',exact:true}).waitFor();
  await page.getByRole('button',{name:'Reactivate',exact:true}).click();await page.getByRole('button',{name:'Archive',exact:true}).waitFor();
  await page.getByRole('button',{name:'Schools',exact:true}).click();await page.getByRole('heading',{name:'Your schools'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Create 30-day pilot'}).count(),0);
  await page.getByRole('button',{name:'Pro & credits',exact:true}).click();await page.getByRole('heading',{name:'Make room for more study.'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Buy 10-session top-up',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Subscribe monthly',exact:true}).isDisabled(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  console.log(JSON.stringify({mobileBrowserChecksPassed:true,viewport:390,signIn:true,liveCourseCreateArchiveReactivate:true,schoolUnapprovedPilotHidden:true,browserPurchasesDisabled:true,noHorizontalOverflow:true,signOut:true,nativeRuntimeClaimed:false}));
}catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=1;}
finally{await browser?.close();if(uid){let deleted,removed;for(let i=0;i<3;i++){deleted=await db.from('courses').delete().eq('user_id',uid);if(!deleted.error)break;}if(deleted.error)throw deleted.error;for(let i=0;i<3;i++){removed=await db.auth.admin.deleteUser(uid);if(!removed.error)break;}if(removed.error)throw removed.error;console.log('Synthetic browser account removed.');}}
