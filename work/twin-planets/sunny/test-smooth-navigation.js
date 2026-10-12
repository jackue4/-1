import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installSurfaceDrag} from './navigation.js';
globalThis.window=new EventTarget();
const canvas=new EventTarget();canvas.setPointerCapture=()=>{};canvas.getBoundingClientRect=()=>({height:956});
const camera=new THREE.PerspectiveCamera(),planet=new THREE.Group();
const controller=installSurfaceDrag(canvas,camera,planet,()=>true,()=>{},()=>{});
function event(type,x=100,y=200,id=1){const e=new Event(type);Object.assign(e,{clientX:x,clientY:y,pointerId:id,pointerType:'touch',button:0});canvas.dispatchEvent(e);}
event('pointerdown');event('pointermove',180);assert.equal(planet.quaternion.angleTo(new THREE.Quaternion()),0);
controller.update(1/60);const first=planet.quaternion.clone();assert.ok(first.angleTo(new THREE.Quaternion())>0);
event('pointerup',180);for(let i=0;i<6;i++)controller.update(1/60);assert.ok(first.angleTo(planet.quaternion)>.03);
for(let i=0;i<180;i++)controller.update(1/60);assert.ok(controller.getState().speed<1);assert.ok(controller.getState().pending<.001);
event('pointerdown');event('pointermove',180);controller.reset();const reset=planet.quaternion.clone();for(let i=0;i<30;i++)controller.update(1/60);assert.ok(reset.angleTo(planet.quaternion)<1e-6);
event('pointerdown');event('pointermove',180);event('pointerdown',250,200,2);event('pointermove',300,200,2);event('pointerup',300,200,2);event('pointerup',180);controller.update(.05);assert.ok(reset.angleTo(planet.quaternion)<1e-6);
event('pointerdown');event('pointermove',180);event('pointercancel');controller.update(.05);assert.ok(reset.angleTo(planet.quaternion)<1e-6);
controller();console.log('PASS: frame-smoothed drag, momentum, settling, view reset, pinch isolation, pointer cancellation');
