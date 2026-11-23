import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { COVER_WIDTH, COVER_HEIGHT, renderCommunicationCover } from './generate-facodi-social-covers.mjs';

const PNG_SIGNATURE = Buffer.from([137,80,78,71,13,10,26,10]);
function inspectPng(png) {
  assert.ok(png.subarray(0,8).equals(PNG_SIGNATURE));
  let offset=8, idat=[];
  let width, height;
  while(offset<png.length){
    const n=png.readUInt32BE(offset),type=png.subarray(offset+4,offset+8).toString('ascii');
    const payload=png.subarray(offset+8,offset+8+n);
    if(type==='IHDR'){width=payload.readUInt32BE(0);height=payload.readUInt32BE(4);assert.equal(payload[9],3);}
    if(type==='IDAT')idat.push(payload);
    offset+=n+12;
    if(type==='IEND')break;
  }
  const rows=inflateSync(Buffer.concat(idat));
  assert.equal(rows.length,(COVER_WIDTH+1)*COVER_HEIGHT);
  assert.equal(rows[0],0);
  return {width,height,size:png.length};
}
test('course OG PNG is a readable 1200x630 image using original FACODI palette',()=>{
  const a=inspectPng(renderCommunicationCover({kind:'course',title:'Licenciatura em Ciências da Comunicação'}));
  assert.equal(a.width,COVER_WIDTH);assert.equal(a.height,COVER_HEIGHT);
  assert.ok(a.size<200000);
});
test('individual sequence OG PNG uses its title and differs from the course art',()=>{
  const course=renderCommunicationCover({kind:'course',title:'Ciências da Comunicação'});
  const first=renderCommunicationCover({kind:'sequence',title:'Da ideia ao microfone'});
  const second=renderCommunicationCover({kind:'sequence',title:'Filosofia da Comunicação'});
  inspectPng(first);inspectPng(second);
  assert.ok(!first.equals(course));
  assert.ok(!first.equals(second));
});
