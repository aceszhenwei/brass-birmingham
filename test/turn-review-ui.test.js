'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');
function setup() {
 const dom = makeDom();
 const E = loadEngine({extraFiles:['uiManager.js'],globals:dom});
 const state = new E.GameState(2,['Alice','Bob'],[],{seed:23});
 const ui = new E.UIManager(); ui.state=state; ui.logic=new E.GameLogic(state);
 ui.completeAction=()=>{}; ui.addLogEntry=(id,msg)=>ui.gameLog.unshift({playerId:id,message:msg});
 ui.cancelAction=()=>{};ui.closeModal=()=>{};ui.renderLog=()=>{};ui.refresh=()=>{};
 return {E,state,ui,dom};
}
test('undo and reset restore resources, cards, spending, RNG and log in-place',()=>{
 const {state,ui}=setup(); state.isFirstRound=false;state.actionsPerTurn=2;
 const original=JSON.stringify(state.serialize()); const id=state.currentPlayerId;
 ui.playMove(id,{type:'loan',card:0});
 assert.equal(ui.undoHistory.length,1);
 assert.notEqual(state.serialize(),original);
 ui.restoreTurn(false);
 assert.equal(JSON.stringify(state.serialize()),original); assert.equal(ui.logic.state,state);assert.equal(ui.gameLog.length,0);
 ui.playMove(id,{type:'loan',card:0});ui.restoreTurn(true);
 assert.equal(JSON.stringify(state.serialize()),original);assert.equal(ui.undoHistory.length,0);
});
test('completed turns and failed moves cannot be undone',()=>{
 const {state,ui}=setup();
 ui.playMove(state.currentPlayerId,{type:'build',city:'missing',card:0});assert.equal(ui.undoHistory.length,0);
 ui.playMove(state.currentPlayerId,{type:'pass',card:0});assert.equal(ui.undoHistory.length,0);
});
test('score components use engine totals and leave the scoring snapshot unchanged',()=>{
 const {state,ui,E}=setup();
 state.boardLinks[E.CONNECTIONS[0].id]={playerId:0,type:'canal'};
 const tile=state.getNextTile(0,E.INDUSTRY_TYPES.COTTON_MILL);
 state.boardIndustries.birmingham_0={playerId:0,type:E.INDUSTRY_TYPES.COTTON_MILL,tileData:tile,flipped:true};
 ui.scoringBoard=state.clone();const original=JSON.stringify(ui.scoringBoard.serialize());
 const html=ui.scoringBreakdown();assert.match(html,/link VP/);assert.match(html,/industry VP/);
 assert.equal(JSON.stringify(ui.scoringBoard.serialize()),original);
});
test('final era shows a scoring review before the final ranking',()=>{
 const {ui}=setup(); let shown=false, callback;
 ui.refresh=()=>{};ui.showToast=()=>{};ui.renderer={clearHighlights(){}};
 ui.showScoring=(title,scores,next)=>{assert.equal(title,'Rail Era Complete');callback=next;};
 ui.showGameOver=()=>{shown=true;};
 ui.completeAction=EComplete();
 function EComplete(){return Object.getPrototypeOf(ui).completeAction;}
 ui.completeAction({success:true,message:'Done',events:[{type:'gameEnd',scores:[],ranking:[]}]});
 assert.equal(shown,false);callback();assert.equal(shown,true);
});
test('scoring capture includes the final action without changing actual progression',()=>{
 const {state,ui}=setup();state.drawDeck=[];
 for(const p of state.players) p.hand=[];
 state.currentPlayer.hand=[{type:'location',location:'birmingham',name:'Birmingham'}];
 const expected=state.clone();new (ui.logic.constructor)(expected).play(state.currentPlayerId,{type:'pass',card:0});
 ui.playMove(state.currentPlayerId,{type:'pass',card:0});
 assert.ok(ui.scoringBoard);assert.equal(ui.scoringBoard.era,'canal');
 assert.equal(JSON.stringify(state.serialize()),JSON.stringify(expected.serialize()));
});
test('board supply spaces contain both wildcard assets',()=>{
 const {setup,descendants}=require('./helpers/svg');
 const {renderer,svg}=setup();renderer.drawBoardImage();
 const images=descendants(svg).filter(n=>n.tagName==='image' || n.tagName==='IMAGE' || n.tag==='image');
 const all=descendants(svg);
 assert.ok(all.some(n=>n.attrs && n.attrs.href==='assets/cards/wild-location.jpg'));
 assert.ok(all.some(n=>n.attrs && n.attrs.href==='assets/cards/wild-industry.jpg'));
});
