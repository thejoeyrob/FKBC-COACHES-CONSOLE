/* FKBC Coaches Console — built-in library.
 * Traditional kickboxing, boxing and Muay Thai material, grouped by lesson style and section type.
 * Coaches can add their own items and hide/remove any built-in item inside the app (Library tab).
 * The grading syllabus is a general traditional kickboxing progression — edit it to match your club's
 * exact grading requirements.
 */
(function () {
  'use strict';
  var G = function (name, items) { return [name, items]; };
  /* grading item: technique, level (Junior / Senior / All), optional coach tip */
  var I = function (t, l, tip) { return tip ? { t: t, l: l, tip: tip } : { t: t, l: l }; };

  var STYLES = [
    { id: 'kickboxing', name: 'Kickboxing', icon: '🥊' },
    { id: 'boxing', name: 'Boxing', icon: '🥊' },
    { id: 'muaythai', name: 'Muay Thai', icon: '🦵' },
    { id: 'fitness', name: 'Fitness', icon: '🔥' }
  ];
  var CATS = ['Warm Up', 'Technique', 'Pad Work', 'Partner Work', 'Sparring', 'Fitness', 'Cool Down'];

  /* ---------- shared ---------- */
  var WARM = [
    G('Get moving', ['Jog around the mats', 'High knees / heel flicks / side shuffles', 'Jumping jacks / star jumps', 'Skipping (rope or shadow rope)', 'Forward / backward / side shuffles', 'Karaoke steps (cross-over side steps)']),
    G('Mobility', ['Neck rolls + shoulder rolls', 'Arm circles (forward and back)', 'Hip circles + leg swings (front and side)', 'Walking lunge with rotation', 'Ankle + wrist mobility', 'Inchworm walk-outs', 'World’s greatest stretch', 'Cat-cow + thoracic rotations']),
    G('Skill primers', ['Shadow boxing – 2 easy rounds', 'Stance + footwork ladder (step, step, pivot)', 'Mirror footwork with a partner', 'Reaction game – partner points, you move', 'Shadow sparring – light and loose'])
  ];
  var COOL = [
    G('Settle', ['Slow walk + deep nose-breathing', 'Box breathing (4-4-4-4)', 'Shake out arms and legs', 'Bow-out and thank your partner']),
    G('Lower body', ['Standing quad stretch', 'Hamstring stretch (seated or standing)', 'Hip flexor lunge stretch', 'Butterfly / groin stretch', 'Pigeon stretch (glutes)', 'Calf stretch against the wall', 'Front splits progression (supported)', 'Side splits / straddle progression', '90/90 hip rotations']),
    G('Upper body + spine', ['Chest and shoulder doorway stretch', 'Cross-body shoulder stretch', 'Tricep stretch', 'Wrist and forearm stretch (fighters’ hands)', 'Child’s pose', 'Seated spinal twist', 'Cobra / upward dog', 'Neck side-stretch'])
  ];
  var FIT_BODY = [
    G('Bodyweight', ['Burpees', 'Squat jumps', 'Press-ups (standard / diamond / wide)', 'Mountain climbers', 'Walking lunges', 'Tuck jumps', 'Bear crawls', 'Sprawls', 'Plank (front / side)', 'Skipping – 3 minute rounds']),
    G('Core', ['Sit-ups / crunches', 'Russian twists', 'V-ups', 'Leg raises', 'Plank shoulder taps', 'Bicycle crunches', 'Dead bugs', 'Hollow hold']),
    G('Cardio', ['Shuttle runs', 'Sprint intervals 20s on / 10s off (Tabata)', 'Ladder drill', 'Hill / stair sprints', 'Circuit – 40s work / 20s rest, 8 stations', 'Pyramid intervals (30-45-60-45-30s)'])
  ];

  /* ---------- KICKBOXING ---------- */
  var KB = {
    'Warm Up': WARM,
    'Technique': [
      G('Stance & footwork', ['Orthodox / southpaw guard', 'Fighting stance + balance', 'Step-drag forward / back', 'Lateral shuffle (left / right)', 'Pivot (left / right)', 'Switch stance', 'Circling the opponent', 'Angle step + counter', 'Distance control – in and out of range']),
      G('Punches', ['Jab', 'Cross', 'Lead hook', 'Rear hook', 'Lead uppercut', 'Rear uppercut', 'Overhand', 'Body jab', 'Body hook (lead / rear)', 'Double jab', 'Jab to the body, jab to the head']),
      G('Kicks', ['Front kick (push)', 'Front kick (snap)', 'Rear roundhouse – body', 'Rear roundhouse – head', 'Lead roundhouse', 'Low kick (rear / lead)', 'Switch kick', 'Side kick (lead / rear)', 'Back kick', 'Hook kick', 'Spinning back kick', 'Spinning hook kick', 'Axe kick', 'Crescent kick', 'Jumping front kick']),
      G('Knees & elbows (where permitted)', ['Rear knee', 'Lead knee', 'Horizontal elbow', 'Upward elbow']),
      G('Defence', ['High guard block', 'Slip (inside / outside)', 'Bob and weave', 'Roll under the hook', 'Parry (jab / cross)', 'Shin check (low / body kick)', 'Elbow block (body)', 'Catch and counter', 'Cover up', 'Step out of range', 'Pivot out and counter', 'Catch a kick and counter'])
    ],
    'Pad Work': [
      G('Punch combinations', ['Jab – Cross', 'Jab – Jab – Cross', 'Jab – Cross – Lead hook', 'Jab – Cross – Lead hook – Cross', 'Jab – Cross – Rear hook', 'Jab – Lead uppercut – Cross', 'Cross – Lead hook – Cross', 'Jab – Body hook – Head hook', 'Jab – Cross – Slip – Cross', 'Jab – Cross – Roll – Lead hook']),
      G('Punch + kick', ['Jab – Cross – Rear roundhouse', 'Jab – Cross – Lead hook – Rear roundhouse', 'Jab – Rear low kick', 'Jab – Cross – Lead low kick', 'Jab – Cross – Front kick', 'Jab – Cross – Side kick', 'Jab – Cross – Hook kick', 'Cross – Lead hook – Rear roundhouse', 'Double jab – Rear roundhouse', 'Jab – Cross – Lead hook – Low kick']),
      G('Kick + punch', ['Rear roundhouse – Jab – Cross', 'Lead roundhouse – Cross – Lead hook', 'Front kick – Jab – Cross', 'Low kick – Cross – Lead hook', 'Side kick – Cross – Lead hook', 'Back kick – Jab – Cross', 'Switch kick – Cross – Rear roundhouse']),
      G('Defence + counter', ['Slip – Cross – Lead hook – Rear roundhouse', 'Parry – Cross – Lead hook', 'Check the kick – Cross – Rear roundhouse', 'Roll – Lead hook – Cross', 'Step back – Front kick – Jab – Cross', 'Catch – Cross – Rear roundhouse']),
      G('Pad drills', ['Technique round (slow and sharp)', 'Power round (3 big combinations)', 'Speed round (light and fast)', 'Call-and-respond (pad holder calls numbers)', 'Pad holder moves – you follow', 'Kicks only round', 'Accuracy round (small targets)', 'Finisher – all-out 30 seconds'])
    ],
    'Partner Work': [
      G('Attack & defend', ['Attacker 50% power, defender defends', 'Jab defence drill (parry / slip / block)', 'Kick defence drill (check / catch / step back)', 'Counter-attack drill – defender returns one shot', 'Combination exchange (take turns)', 'Slip-and-return drill']),
      G('Timing & distance', ['Distance control – one steps in, one steps out', 'Mirror drill (follow your partner)', 'Timing drill – meet the jab', 'Light touch tapping (no force)', 'Reaction drill – react to the visual cue', 'Stop-hit drill']),
      G('Pads & shields', ['Pad holder feeding + reactions', 'Focus mitt call-outs', 'Kick shield drill (partner holds shield)', 'Hold pads for your partner (technical feedback)', 'Rotation – 3 techniques, 3 partners'])
    ],
    'Sparring': [
      G('Controlled', ['Technical sparring (50% power)', 'Light touch sparring', 'Footwork-focused sparring', 'Boxing-only sparring', 'Kicks-only sparring', 'Specific shot setup sparring (e.g. jab only)']),
      G('Skill-focused', ['Defence-only round (attacker works at 50%)', 'Counter-only round', 'Point sparring (continuous / semi-contact)', 'Ring-craft: cut off the ring', 'Escape the corner', 'Pressure round (move forward)', 'Outside fighting round (stay long)']),
      G('Open', ['Open sparring', 'Rotating partners (change each round)', 'King of the ring (winner stays on)', 'Fight-pace sparring (3 x 2 min)', 'Shadow sparring (no partner)'])
    ],
    'Fitness': [
      G('Bag work', ['Heavy bag – 30s on / 15s off', 'Heavy bag power rounds (jab – cross – hook)', 'Bag kicks – 10 each leg', 'Bag – 100 punches', 'Bag – combo pyramids', 'Bag tabata (20s on / 10s off)', 'Bag – kick and knee rounds']),
      G('Kickboxing conditioning', ['Kickboxing circuit', 'Shadow kickboxing with ankle weights (light)', 'Shin conditioning on the bag (gradual)', 'Leg endurance: 3 x 20 rear roundhouse', 'Skipping + shadow combo rounds'])
    ].concat(FIT_BODY),
    'Cool Down': COOL
  };

  /* ---------- BOXING ---------- */
  var BOX = {
    'Warm Up': [
      G('Get moving', ['Skipping – 3 x 3 minutes', 'Jog + high knees', 'Shuffle + shadow box', 'Jumping jacks / star jumps', 'Roadwork style light jog on the spot']),
      G('Mobility', ['Neck rolls + shoulder rolls', 'Arm circles and shoulder dislocates with a band', 'Torso rotations', 'Hip circles + leg swings', 'Wrist and forearm prep', 'Inchworm walk-outs']),
      G('Skill primers', ['Shadow boxing – 3 x 2 minutes', 'Footwork ladder – in-in-out-out', 'Slip-rope drill (slip the rope line)', 'Mirror shadow with a partner'])
    ],
    'Technique': [
      G('Stance & footwork', ['Orthodox / southpaw stance', 'Weight transfer and balance', 'Jab step (step and punch together)', 'Step-drag forward and back', 'Pivoting on the lead foot', 'Circle left / circle right', 'Angle out after punching', 'Footwork ladder drills']),
      G('Punches (numbering)', ['1 – Jab', '2 – Cross', '3 – Lead hook', '4 – Rear hook', '5 – Lead uppercut', '6 – Rear uppercut', 'Overhand right', 'Jab to the body', 'Body hook (lead / rear)', 'Short hooks inside', 'Straight cross over the jab']),
      G('Defence', ['Block (high guard / long guard)', 'Parry', 'Slip (outside / inside)', 'Bob and weave', 'Roll under the hook', 'Shoulder roll (Philly shell)', 'Catch the jab', 'Cover up + counter', 'Step back / pull back', 'Clinch to smother']),
      G('Ring craft', ['Cutting off the ring', 'Using the ropes (angles and escapes)', 'Working inside', 'Working off the jab', 'Feints (shoulder, eye, step)', 'Controlling distance'])
    ],
    'Pad Work': [
      G('Basic numbers', ['1 – 2', '1 – 1 – 2', '1 – 2 – 3', '1 – 2 – 3 – 2', '1 – 2 – 3 – 4', '1 – 2 – 5 – 2', '1 – 2 – 3 – 6', '2 – 3 – 2', '1 – 6 – 3 – 2', '3 – 2 – 3', '1 – 1 – 2 – 3 – 2']),
      G('Body + head', ['1 – 2 – 3 to the body – 3 to the head', '1 – body hook – head hook', '1 – 2 – lead hook to the body – cross', '1 – 2 – 3 – 2 (end with a body cross)', 'Double jab – cross – hook']),
      G('Defence + counter', ['Slip – 2 – 3 – 2', 'Parry – 2 – 3', 'Roll – 3 – 2', 'Pull back – 1 – 2', 'Block – 3 – 2 – 3', 'Shoulder roll – 2 – 3', 'Duck – 2 – 3']),
      G('Pad drills', ['Technique round (slow and clean)', 'Speed round (light and fast)', 'Power round (3 big combinations)', 'Call-and-respond', 'Mitts: movement – holder moves, you follow', 'Accuracy round', 'Counterpunching round (holder throws pads)'])
    ],
    'Partner Work': [
      G('Defence', ['Slip the jab drill', 'Parry and counter', 'Roll under the hook drill', 'Block and return', 'Catch and counter', 'Shoulder roll drill']),
      G('Timing & distance', ['Jab to meet the jab', 'Distance control – one in, one out', 'Mirror drill', 'Touch-boxing (very light)', 'Reaction drill – react to colour or number call', 'Feint and counter drill']),
      G('Mitts', ['Hold mitts for your partner (feedback)', 'Mitt call-outs (numbers)', 'Rotation – 3 techniques, 3 partners'])
    ],
    'Sparring': [
      G('Controlled', ['Technical sparring (50%)', 'Light touch sparring', 'Jab-only sparring', 'Body-shot-only sparring', 'Footwork-focused sparring']),
      G('Skill-focused', ['Defence-only round (attacker at 50%)', 'Counter-only round', 'Inside fighting round', 'Outside fighting round (long jab)', 'Cut off the ring round', 'Ropes escape round']),
      G('Open', ['Open boxing sparring', 'Rotating partners', 'Fight-pace sparring (3 x 3 min)'])
    ],
    'Fitness': [
      G('Boxing conditioning', ['Heavy bag – 3 minute rounds', 'Heavy bag – 30s on / 15s off', 'Bag combos 1-2, 1-2-3, 1-2-3-2 (increase pace)', 'Speed bag / double-end bag rounds', 'Skipping – 3 x 3 minutes', 'Shadow boxing with light weights (careful)', 'Medicine ball slams and twists', 'Roadwork-style intervals (run)', 'Neck and shoulder conditioning'])
    ].concat(FIT_BODY),
    'Cool Down': COOL
  };

  /* ---------- MUAY THAI ---------- */
  var MT = {
    'Warm Up': [
      G('Get moving', ['Skipping – 3 x 3 minutes', 'Jog + high knees', 'Shuffle + shadow Muay Thai', 'Jumping jacks / star jumps']),
      G('Mobility', ['Neck rolls + shoulder rolls', 'Hip openers (leg swings, front and side)', 'Deep squat hold + rotations', 'Ankle + wrist mobility', 'Hip circles', 'Walking lunge + rotation']),
      G('Skill primers', ['Ram Muay (shadow warm-up dance) – optional', 'Shadow Muay Thai – 3 x 2 min', 'Teep walks (alternate teep stepping forward)', 'Knee drive drill (air knees)', 'Footwork ladder + kick', 'Mirror shadow with a partner'])
    ],
    'Technique': [
      G('Stance & footwork', ['Muay Thai stance (upright, weight slightly back)', 'Step-drag forward / back', 'Pivot on the ball of the foot', 'Switch stance', 'Cutting the ring', 'Check footwork with the teep']),
      G('Punches', ['Jab', 'Cross', 'Lead hook', 'Rear hook', 'Uppercut', 'Overhand', 'Body shots']),
      G('Kicks', ['Teep – lead (push kick)', 'Teep – rear (push kick)', 'Roundhouse – low (leg)', 'Roundhouse – body', 'Roundhouse – head', 'Switch kick', 'Angled / oblique kick', 'Spinning back kick', 'Teep to the thigh (check)']),
      G('Knees', ['Straight knee', 'Diagonal knee', 'Curved knee', 'Flying knee (shadow / bag)', 'Knee from the clinch']),
      G('Elbows', ['Horizontal elbow', 'Upward elbow', 'Downward elbow', 'Diagonal elbow', 'Spinning elbow (shadow / pad)', 'Elbow from the clinch']),
      G('Clinch', ['Plum / double collar tie', 'Pummelling for position', 'Neck pull + knee', 'Off-balance and sweeps', 'Clinch defence – frames and underhooks', 'Clinch break and push-off']),
      G('Defence', ['Check the low kick (shin check)', 'Check the body kick (elbow + leg)', 'Catch the kick + sweep', 'Teep defence (parry / block / angle)', 'Cover up + counter', 'Slip + counter', 'Block high kicks'])
    ],
    'Pad Work': [
      G('Basics', ['Jab – Cross – Roundhouse', 'Jab – Cross – Lead hook – Roundhouse', 'Teep – Cross – Roundhouse', 'Jab – Teep – Cross', 'Cross – Lead hook – Roundhouse', 'Roundhouse – Roundhouse – Cross']),
      G('Knees & elbows', ['Jab – Cross – Knee', 'Jab – Cross – Elbow', 'Teep – Knee – Elbow', 'Clinch – Knee – Knee – Knee', 'Double elbow (horizontal – upward)', 'Cross – Lead hook – Knee – Roundhouse']),
      G('Defence + counter', ['Check the kick – Cross – Roundhouse', 'Catch – Cross – Roundhouse', 'Teep defence – Cross – Roundhouse', 'Slip – Cross – Knee', 'Block – Roundhouse – Roundhouse']),
      G('Pad rounds', ['Technique round (slow and sharp)', 'Power kicks round (5 each side)', 'Knees round (clinch pads)', 'Elbows round', 'Speed and fluency round', 'Fight-pace round (3 minutes)', 'Kick catch + counter round'])
    ],
    'Partner Work': [
      G('Clinch', ['Clinch – pummelling for position', 'Plum control + knees (light)', 'Sweep and off-balance drill', 'Clinch escape drill', 'Clinch – one attacks, one defends']),
      G('Kicks & defence', ['Kick check drill (partner kicks, you check)', 'Kick catch + sweep drill', 'Teep distance drill', 'Teep-and-counter drill', 'Timing drill – teep to stop the attack']),
      G('Pads', ['Hold pads for your partner (feedback)', 'Kick shield drill', 'Thai pads call-outs', 'Rotation – 3 techniques, 3 partners'])
    ],
    'Sparring': [
      G('Controlled', ['Technical sparring (50% – no elbows)', 'Kicks-and-teeps only', 'Boxing + teep only', 'Clinch-only sparring (light)', 'Knees from the clinch (light)']),
      G('Skill-focused', ['Defence-only round', 'Counter-only round', 'Teep-and-move round', 'Distance control round', 'Fight-pace rounds (5 x 3 min)']),
      G('Open', ['Open Muay Thai sparring (light contact)', 'Rotating partners', 'Technical sparring with shin guards'])
    ],
    'Fitness': [
      G('Muay Thai conditioning', ['Heavy bag kick rounds (3 minutes)', 'Bag – 100 kicks (alternate legs)', 'Bag – knee rounds', 'Teep – 30s on / 15s off (bag)', 'Shadow Muay Thai – 5 rounds', 'Neck strength (partner resistance, light)', 'Skipping – 5 rounds', 'Core + hip stability work'])
    ].concat(FIT_BODY),
    'Cool Down': COOL
  };

  /* ---------- FITNESS ---------- */
  var FIT = {
    'Warm Up': WARM,
    'Technique': [
      G('Movement skills', ['Squat pattern', 'Hinge pattern (hip hinge)', 'Lunge pattern', 'Push-up pattern', 'Plank + core bracing', 'Jump + land safely']),
      G('Kickboxing basics for fitness', ['Stance + footwork', 'Jab / cross', 'Hook', 'Uppercut', 'Front kick (push)', 'Rear roundhouse (bag / pad)', 'Knee strike (bag)'])
    ],
    'Pad Work': [
      G('Fitness pad combos', ['Jab – Cross', 'Jab – Cross – Hook – Cross', 'Jab – Cross – Front kick', 'Jab – Cross – Knee', 'Jab – Cross – Rear roundhouse', 'Hook – Hook – Cross']),
      G('Rounds', ['Technique round', 'Speed round', 'Power round', 'Burn-out round (30 seconds all-out)'])
    ],
    'Partner Work': [
      G('Partner', ['Pad holder + hitter swap each round', 'Partner circuit (A works, B holds then swap)', 'Mirror drills', 'Partner plank taps', 'Medicine ball passes'])
    ],
    'Sparring': [G('Optional', ['Light shadow sparring', 'Pad-based fight-pace rounds', 'Reaction game (partner calls colours)'])],
    'Fitness': [
      G('Circuits', ['Circuit – 40s work / 20s rest, 8 stations', 'Circuit – 45s work / 15s rest, 6 stations (2 rounds)', 'Boxing-gym circuit: bag / burpees / skipping / press-ups / pads / core', 'Tabata blocks (20s on / 10s off x 8)', 'Pyramid intervals']),
      G('Bag work', ['Heavy bag – 30s on / 15s off', 'Bag punch combos – increasing pace', 'Bag kicks – 10 each leg', 'Bag power rounds'])
    ].concat(FIT_BODY),
    'Cool Down': COOL
  };

  var LIB = { kickboxing: KB, boxing: BOX, muaythai: MT, fitness: FIT };

  /* ---------- GRADING SYLLABUS (traditional kickboxing, 9 belts) ---------- */
  var BELTS = [
    ['White', '#f5f5f5', '#111'], ['Red', '#e5242a', '#fff'], ['Yellow', '#f0c522', '#111'],
    ['Orange', '#f28a18', '#111'], ['Green', '#16a34a', '#fff'], ['Purple', '#7e38c8', '#fff'],
    ['Blue', '#1b5ad7', '#fff'], ['Brown', '#8b5130', '#fff'], ['Black', '#111', '#fff']
  ];
  var SYLL = {
    /* White / Red / Yellow come from the club grading sheets: same sections, Junior / Senior tags and coach tips.
       Item = I(technique, level, coach tip). Coach tips are for coaches only and are never shown on the timer. */
    White: [
      G('Stance', [I('Left Leg Forward', 'Junior', 'Good fists, tight guard, elbows tucked in'), I('Left & Right Leg Forward', 'Senior', 'Feet position / centre line')]),
      G('Arm techniques', [I('Jab / Snap Punch', 'Junior', 'Speed'), I('Reverse Punch / Cross', 'Junior', 'Power, pivot, guard change'), I('Backfist Both Arms', 'Senior', 'Point with elbow, pivot, strike with back of hand')]),
      G('Kicks', [I('Snap Front Kick Lead Leg', 'Junior', 'Speed, point with knee, kick with ball of the foot'), I('Snap Front Kick Rear Leg', 'Junior', 'As above with guard change'), I('Roundhouse Kick Rear Leg', 'Junior', 'Speed, point with knee, kick with instep of foot'), I('Front Knee Lead Leg', 'Senior', 'Knee forwards not up, lean back for power'), I('Front Knee Rear Leg', 'Senior', 'As above but with long guard for high grades')]),
      G('Defence', [I('Roll', 'Junior', 'Roll outside of punch'), I('Parry / Palm Deflection', 'Senior', 'Open hand to punch, parry down or across'), I('Downward Outside Deflection Lead Arm (to front kick attack)', 'Senior', 'Turning kicks away, closing the opponent / deflect the danger')]),
      G('Combinations', [I('Front Kick Lead Leg, Jab, Cross', 'All', 'Look for landing into jab'), I('Jab, Front Kick Lead Leg, Roundhouse Kick Rear Leg', 'All', 'Jab to open mid section for front kick and roundhouse kick to land'), I('Jab, Cross, Roundhouse Kick Rear', 'All', 'Punch to raise guard to land roundhouse kick')]),
      G('Padwork', [I('Pad work with Coach', 'Junior'), I('Pad work with Partner', 'Senior', 'Correct pad holding, spotting')]),
      G('Sparring', [I('One Step sparring', 'Senior', 'One technique attack and defence')])
    ],
    Red: [
      G('Stance', [I('Left Leg Forward', 'Junior'), I('Left & Right Leg Forward', 'Senior')]),
      G('Arm techniques', [I('Hook Punch Lead & Rear Arms', 'Junior', 'Thumb upwards & pivot, guard change for rear arm'), I('Stepping Jab', 'Junior', 'Change stance to close distance; seniors look to step in a C shape to not open up the body'), I('Stepping Reverse Punch', 'Junior'), I('Hook Punch Close / Long Quarter', 'Senior', 'Understand the difference')]),
      G('Kicks', [I('One Step Front Kick', 'Junior', 'Step with rear leg to close distance'), I('Side Kick Lead Leg', 'Junior', 'Stamp technique'), I('Roundhouse Kick Lead Leg (skip)', 'Junior', 'As above with guard change'), I('Side Kick Both Legs', 'Senior'), I('Roundhouse Knee', 'Senior')]),
      G('Defence', [I('Outside Forearm Block', 'Junior', 'Block on the dead arm bicep'), I('Downward Inside Deflection Lead Arm (to front kick attack)', 'Senior', 'Turning kicks to open the opponent')]),
      G('Combinations', [I('Stepping Jab, Cross, Roundhouse Kick', 'All', 'Guard change for stepping jab means punch and kick off the NEW rear, then step back'), I('Jab, Reverse Punch, Hook Lead Arm', 'All', 'Hook would be long'), I('One Step Front Kick, Front Knee, Hook Punch Lead Arm', 'All', 'Hook would be short')]),
      G('Padwork', [I('Pad work with Coach', 'Junior'), I('Pad work with Partner', 'Senior', 'Correct pad holding, spotting')]),
      G('Sparring', [I('One Step sparring', 'Junior', 'One technique attack and defence'), I('Light Contact sparring', 'Senior')])
    ],
    Yellow: [
      G('Stance', [I('Left Leg Forward', 'Junior'), I('Left & Right Leg Forward', 'Senior')]),
      G('Arm techniques', [I('Uppercut Lead & Rear Arms', 'Junior'), I('Jumping Jab', 'Junior'), I('Jumping Reverse Punch', 'Junior', 'Superman punch'), I('Uppercut Close / Long Quarter', 'Senior', 'Understand the difference')]),
      G('Kicks', [I('Push Front Kick', 'Junior', 'Curl, flick front kick (snake kick); strike with ball of foot'), I('One Step Sidekick', 'Junior', 'Pendulum if able'), I('Jump Front Kick', 'Junior', 'Lead leg'), I('Heel (Thrust / Teep) Front Kick', 'Senior', 'Stamp')]),
      G('Defence', [I('Inside Forearm Block', 'Junior'), I('Inside Knee / Shin Block', 'Junior'), I('Side Step Evasion', 'Senior')]),
      G('Combinations', [I('Jump Front Kick, Jab, Jump Reverse Punch', 'All'), I('One Step Sidekick, Jab, Uppercut', 'All'), I('Jab, Uppercut Rear Arm, Hook Punch Lead Arm', 'All')]),
      G('Padwork', [I('Pad work with Coach', 'Junior'), I('Pad work with Partner', 'Senior', 'Correct pad holding, spotting')]),
      G('Sparring', [I('Light Contact sparring', 'Junior'), I('Sparring 2 x 2 min rounds', 'Senior')])
    ],
    Orange: [
      G('Stance & movement', ['Switch stance with a kick', 'Ring movement – cutting angles']),
      G('Punches', ['Overhand', 'Jab to the body – jab to the head', 'Cross – Lead hook – Cross']),
      G('Kicks', ['Back kick (pad)', 'Hook kick (introduction)', 'Lead roundhouse to the head', 'Switch kick']),
      G('Defence', ['Roll under the hook', 'Catch and counter', 'Check – return kick', 'Counter punch']),
      G('Combinations', ['Jab – Rear roundhouse – Cross – Lead hook', 'Kick – Punch – Kick sequence']),
      G('Fitness & sparring', ['25 press-ups', '50 sit-ups', 'Light sparring – 2 x 2 minutes', 'Pad rounds – 3 x 2 minutes'])
    ],
    Green: [
      G('Kicks', ['Hook kick (full)', 'Spinning back kick (introduction)', 'Axe kick (introduction)', 'Jumping front kick']),
      G('Defence', ['Evasion with angles', 'Counter low kick', 'Parry and counter', 'Catch a kick and counter']),
      G('Combinations', ['5+ strike combination flow', 'Block – Return – Kick', 'Rear roundhouse – Cross – Lead hook – Low kick']),
      G('Fitness & sparring', ['30 press-ups', 'Technical sparring – 3 x 2 minutes', 'Pad drill – 3 rounds (own combinations)', 'Control and respect in sparring'])
    ],
    Purple: [
      G('Kicks', ['Spinning hook kick', 'Spinning back kick (full)', 'Crescent kick', 'Axe kick (full)']),
      G('Defence', ['Catch kick and sweep (introduction)', 'Check and counter', 'Counter attack drills']),
      G('Combinations', ['Kick / punch / kick sequence', 'Counter-attack combinations', 'Pad drill – 5 rounds (own sequences)']),
      G('Fitness & sparring', ['35 press-ups', 'Controlled sparring – 3 x 2 minutes', 'Technical sparring drills (set-ups)'])
    ],
    Blue: [
      G('Advanced technique', ['Advanced combinations (6+ strikes)', 'Body-shot entries', 'Counter low kick', 'Defence chain (slip – roll – counter)']),
      G('Ring craft', ['Cutting off the ring', 'Angles and pivots', 'Distance management']),
      G('Fitness & sparring', ['40 press-ups', 'Continuous sparring – 3 x 2 minutes', 'Show both punching and kicking range control'])
    ],
    Brown: [
      G('Advanced technique', ['Fight-pace combinations', 'Clinch control – break and push-off', 'Ring-craft – pressure and escape']),
      G('Sparring', ['Pressure sparring', 'Counter sparring', 'Sparring – 4 x 2 minutes']),
      G('Teaching', ['Lead a warm-up', 'Demonstrate a technique to a junior grade', 'Hold pads for a junior grade correctly'])
    ],
    Black: [
      G('Leadership', ['Leadership drill (lead a class segment)', 'Teach a full technique block', 'Assess juniors and give feedback']),
      G('Technique', ['Advanced pad sequence (10 strikes)', 'Advanced sparring concept / strategy', 'Full syllabus demonstration']),
      G('Assessment', ['Assessment – 5 x 2 minute rounds', 'Verbal: history, etiquette and safety', 'Own choreographed combination routine'])
    ]
  };

  var QUICK = {
    kickboxing: ['JAB', 'CROSS', 'HOOK', 'UPPERCUT', 'FRONT KICK', 'ROUNDHOUSE', 'LOW KICK', 'SIDE KICK', 'BACK KICK', 'HOOK KICK', 'KNEE', 'SLIP', 'PARRY', 'CHECK', 'PIVOT', 'BLOCK'],
    boxing: ['JAB', 'CROSS', 'LEAD HOOK', 'REAR HOOK', 'UPPERCUT', 'BODY SHOT', 'SLIP', 'ROLL', 'PARRY', 'BLOCK', 'PIVOT', 'FEINT', 'DOUBLE JAB', 'COUNTER'],
    muaythai: ['JAB', 'CROSS', 'HOOK', 'TEEP', 'ROUNDHOUSE', 'KNEE', 'ELBOW', 'CLINCH', 'CHECK', 'CATCH', 'SWEEP', 'SLIP', 'BLOCK'],
    fitness: ['BURPEES', 'PRESS-UPS', 'SQUATS', 'LUNGES', 'PLANK', 'SKIPPING', 'SHUTTLES', 'BAG ROUND', 'CORE', 'SPRINTS']
  };

  var GRADE = { White: 'Level 1 White Grade', Red: 'Level 2 Red Grade', Yellow: 'Level 3 Yellow Grade' };
  window.FKLIB = { GRADE: GRADE, STYLES: STYLES, CATS: CATS, LIB: LIB, BELTS: BELTS, SYLL: SYLL, QUICK: QUICK };
})();
