'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');
const { loc, ind, placeIndustry } = require('./helpers/scenario');
const { setup: svgSetup, descendants } = require('./helpers/svg');
function setup() {
    const dom = makeDom();
    const E = loadEngine({extraFiles:['industryIcons.js','uiManager.js'],globals:dom});
    const state = new E.GameState(3,['Alice','Bob','Carol'],[],{seed:91});
    const logic = new E.GameLogic(state), ui = new E.UIManager();
    ui.state=state;ui.logic=logic;ui.aiRng=new E.SeededRandom(1);
    const highlights={slots:[],routes:[]};
    ui.renderer={ fullUpdate(){}, clearHighlights(){highlights.slots=[];highlights.routes=[];},
        highlightSlots(t){highlights.slots=t;},highlightConnections(t){highlights.routes=t;} };
    const choices=[]; ui.showChoiceModal=(choice,onPick)=>choices.push({choice,onPick});
    ui.showToast=()=>{};
    return {E,dom,state,logic,ui,highlights,choices};
}
function target(kind,dataset) {
    const el={dataset,classList:{contains(){return true;}},closest(selector){return selector.includes(kind)?el:null;}};
    return {target:el};
}

test('card-first Build highlights only legal card targets and waits for explicit confirmation',()=>{
    const {E,state,ui,highlights,dom}=setup();
    const pid=state.currentPlayerId;
    state.players[pid].hand=[ind(E.INDUSTRY_TYPES.COAL_MINE),loc('belper')];
    ui.onCardClicked(0);
    assert.equal(ui.selectedAction,'build');
    assert.ok(highlights.slots.length>0);
    assert.ok(highlights.slots.every(t=>t.industryType===E.INDUSTRY_TYPES.COAL_MINE));
    const t=highlights.slots[0];
    state.players[pid].hand[1]=loc(t.cityId==='dudley'?'worcester':'dudley');
    const before=JSON.stringify(state.serialize());
    ui.onBoardClick(target('.industry-slot',{city:t.cityId,slot:String(t.slotIndex)}));
    assert.equal(ui.pendingData.review,true);
    assert.equal(JSON.stringify(state.serialize()),before,'selection and review spend nothing');
    const text=dom.document.getElementById('action-details').children.map(n=>n.textContent).join(' ');
    assert.match(text,/Total £\d+/); assert.match(text,/Discard:/); assert.match(text,/Confirm build/);
    ui.onCardClicked(1); assert.equal(ui.selectedCard,0,'invalid discard does not replace the legal card');
    ui.confirmPendingMove();
    assert.equal(state.boardIndustries[`${t.cityId}_${t.slotIndex}`].type,E.INDUSTRY_TYPES.COAL_MINE);
    assert.equal(state.players[pid].discardPile.at(-1).industryTypes[0],E.INDUSTRY_TYPES.COAL_MINE);
});

test('location-card highlights stay in that location, and cancel leaves the game untouched',()=>{
    const {state,ui,highlights}=setup(); const pid=state.currentPlayerId;
    state.players[pid].hand=[loc('dudley')]; const before=JSON.stringify(state.serialize());
    ui.onCardClicked(0); assert.ok(highlights.slots.every(t=>t.cityId==='dudley'));
    ui.cancelAction(); assert.equal(JSON.stringify(state.serialize()),before);
    assert.equal(ui.selectedAction,null); assert.equal(ui.selectedCard,null);
});

test('map-first Build chooses a slot, then a card, then confirms',()=>{
    const {E,state,ui}=setup(); const pid=state.currentPlayerId;
    state.players[pid].hand=[ind(E.INDUSTRY_TYPES.COAL_MINE)];
    ui.onBoardClick(target('.industry-slot',{city:'dudley',slot:'0'}));
    assert.equal(ui.actionStep,1); assert.equal(ui.pendingData.review,undefined);
    ui.onCardClicked(0); assert.equal(ui.pendingData.review,true);
    assert.equal(state.boardIndustries.dudley_0,undefined);
    ui.confirmPendingMove(); assert.equal(state.boardIndustries.dudley_0.type,E.INDUSTRY_TYPES.COAL_MINE);
});

test('Network is selected on the map with any preselected discard card and no route-list modal',()=>{
    const {state,ui,highlights}=setup(); const pid=state.currentPlayerId;
    state.players[pid].hand=[loc('dudley')];
    ui.onCardClicked(0); ui.onActionSelected('network');
    assert.equal(ui.selectedCard,0); assert.ok(highlights.routes.length>0);
    const conn=highlights.routes[0]; const before=JSON.stringify(state.serialize());
    ui.onBoardClick(target('.connection-line',{connection:conn}));
    assert.equal(ui.pendingData.review,true); assert.equal(JSON.stringify(state.serialize()),before);
    ui.confirmPendingMove(); assert.equal(state.boardLinks[conn].playerId,pid);
});

test('double Rail uses second map targets and consumes both links in one confirmed action',()=>{
    const {E,state,ui,highlights}=setup(); const pid=state.currentPlayerId;
    state.era=E.ERA.RAIL; state.actionsPerTurn=2; state.isFirstRound=false;
    state.players[pid].money=100; state.players[pid].hand=[loc('dudley'),loc('walsall')];
    placeIndustry(E,state,'wolverhampton_0',pid,E.INDUSTRY_TYPES.COAL_MINE,2,{resourceCubes:6});
    placeIndustry(E,state,'northern',pid,E.INDUSTRY_TYPES.BREWERY,2,{resourceCubes:2});
    ui.onActionSelected('network');
    const first=highlights.routes.find(id=>ui.logic.getValidSecondRailLinks(pid,id).length>0);
    assert.ok(first);
    ui.onBoardClick(target('.connection-line',{connection:first}));
    assert.ok(ui.pendingData.secondRail.length>0);
    const second=ui.pendingData.secondRail[0].connectionId;
    ui.onBoardClick(target('.connection-line',{connection:second}));
    assert.equal(state.boardLinks[first],undefined);
    ui.onCardClicked(0); assert.equal(ui.pendingData.review,true);
    ui.confirmPendingMove();
    assert.equal(state.boardLinks[first].playerId,pid);assert.equal(state.boardLinks[second].playerId,pid);
    assert.equal(state.actionsThisTurn,1);
});

test('live coal and iron count badges cover capacity symbols and keep remaining counts separate',()=>{
    const {E,svg,renderer}=svgSetup();
    for(const type of [E.INDUSTRY_TYPES.COAL_MINE,E.INDUSTRY_TYPES.IRON_WORKS]){
        renderer.drawResourceCount(svg,0,0,{type,resourceCubes:2});
    }
    const badges=descendants(svg).filter(n=>n.attrs.class==='live-resource-count');
    assert.equal(badges.length,2);assert.ok(badges.every(n=>n.attrs['data-remaining']==='2'));
    assert.ok(badges.every(n=>descendants(n).some(c=>c.textContent==='LEFT')));
});
