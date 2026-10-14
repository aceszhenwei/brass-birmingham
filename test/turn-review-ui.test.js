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
test('scoring keeps separate Canal and Rail industry/link totals without exposing raw IDs',()=>{
 const {state,ui,dom}=setup();const before=JSON.stringify(state.serialize());
 ui.showScoring('Canal Era Complete',[{playerId:0,industryVP:10,linkVP:16,totalVP:26},{playerId:1,industryVP:8,linkVP:9,totalVP:17}]);
 let html=dom.document.getElementById('scoring-details').innerHTML;
 assert.match(html,/Canal Industry<\/dt><dd>10/);assert.match(html,/Canal Links<\/dt><dd>16/);
 assert.match(html,/Total Canal<\/dt><dd[^>]*>26/);assert.doesNotMatch(html,/Rail Industry/);
 ui.showScoring('Rail Era Complete',[{playerId:0,industryVP:26,linkVP:12,totalVP:64},{playerId:1,industryVP:22,linkVP:27,totalVP:66}]);
 html=dom.document.getElementById('scoring-details').innerHTML;
 assert.match(html,/Canal Industry<\/dt><dd>10/);assert.match(html,/Rail Industry<\/dt><dd>26/);
 assert.match(html,/Rail Links<\/dt><dd>12/);assert.match(html,/Total Rail<\/dt><dd[^>]*>38/);
 assert.match(html,/Cumulative VP<\/dt><dd[^>]*>64/);assert.doesNotMatch(html,/burtonOnTrent|scoring breakdown/);
 assert.equal(JSON.stringify(state.serialize()),before);
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
test('scoring presentation includes the final action without changing actual progression',()=>{
 const {state,ui}=setup();state.drawDeck=[];
 for(const p of state.players) p.hand=[];
 state.currentPlayer.hand=[{type:'location',location:'birmingham',name:'Birmingham'}];
 const expected=state.clone();new (ui.logic.constructor)(expected).play(state.currentPlayerId,{type:'pass',card:0});
 ui.playMove(state.currentPlayerId,{type:'pass',card:0});
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
