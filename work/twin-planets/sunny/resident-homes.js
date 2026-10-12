// Arrival is a doorway transition, never a shortcut through house collision.
// The animal remains outside the solid porch until the door opens, then enters
// its indoor state. Hidden residents no longer obstruct the path or doorway.
export function createResidentHomes({residents,cottages,navigation}){
  let bedtime=false,morningAt=0;
  const states=residents.map((p,i)=>{const home=cottages[i%cottages.length],goal=navigation.safeGoal(home.entryNormal),away=goal.clone().sub(home.root.position.clone().normalize()).normalize(),exit=navigation.safeGoal(goal.clone().addScaledVector(away,.17).normalize());return{mode:'outside',home,goal,exit,arrivedAt:0};});
  function update(dt,t,env){
    const wasNight=bedtime,severe=Math.max(env.storm||0,env.tornado||0);if(env.night>.62||severe>.4)bedtime=true;else if(env.night<.30&&severe<.15)bedtime=false;
    if(wasNight&&!bedtime)morningAt=t;
    for(const [i,p] of residents.entries()){
      const s=states[i];
      if(navigation.blocked(s.goal))s.goal=navigation.safeGoal(s.home.entryNormal);
      if(bedtime){
        if(s.mode==='outside'||s.mode==='leaving')s.mode='returning';
        // The porch is an arrival area, not a single point that several bodies
        // must occupy simultaneously. Admit one neighbour at a time.
        if(s.mode==='returning'&&s.home.getState().complete&&p.normal.distanceTo(s.goal)<.075&&!states.some(q=>q.home===s.home&&q.mode==='entering')){s.mode='entering';s.arrivedAt=t;s.home.welcomeHome(t);}
        if(s.mode==='entering'){
          s.home.welcomeHome(t);
          if(t-s.arrivedAt>1.5){s.mode='inside';p.root.visible=false;p.working=false;}
        }
      }else{
        if(s.mode==='inside'){
          if(t>=morningAt+1+(i%3)*2.5){const door=s.goal;if(!residents.some(q=>q!==p&&q.root.visible&&q.normal.distanceTo(door)<.11)){p.normal.copy(door);p.nav=null;p.root.visible=true;s.home.welcomeHome(t);s.mode='leaving';}}
        }else if(s.mode==='leaving'){if(p.normal.distanceTo(s.exit)<.028&&!states.some(q=>q.home===s.home&&q.mode==='inside'))s.mode='outside';}else s.mode='outside';
      }
      p.homeState=s.mode;p.homeName=s.home.name;
    }
  }
  function pose(i){const s=states[i];if(s.mode==='leaving')return{normal:s.exit,lookAt:s.exit,mode:'home'};return bedtime&&s.mode!=='inside'?{normal:s.goal,lookAt:s.home.root.position.clone().normalize(),mode:'home'}:null;}
  return{update,pose,getState:()=>({bedtime,inside:states.filter(s=>s.mode==='inside').length,returning:states.filter(s=>s.mode==='returning'||s.mode==='entering').length})};
}
