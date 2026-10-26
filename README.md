# ChemLab 3D — Engineering Chemistry Simulator

A first-person 3D chemistry-lab game built with [Three.js](https://threejs.org/). Pick one of nine
Engineering Chemistry practicals and perform it step by step. Only the action highlighted for the
current step is allowed — there is no free-play, so nothing can go "off script".

## Run

No build step. Serve the folder with any static server and open it in a browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Three.js is vendored in `vendor/`, so it works offline.)

## The nine experiments

1. Molecular weight of a polymer using Ostwald's viscometer
2. Preparation of nylon 6,10 by interfacial polymerization
3. Determination of iron concentration using a colorimeter
4. Effect of environmental conditions on metal corrosion
5. Percentage moisture, volatile matter and ash in coal
6. Equivalence point of acetic acid–NaOH titration using a pH meter
7. Separation of organic compounds by thin-layer chromatography (TLC)
8. Kinetics of acid-catalysed hydrolysis of ethyl acetate
9. Electrochemical equivalent (ECE) of copper

## Screen layout

| Area | Content |
| --- | --- |
| Top-left | Current step: what to do |
| Top-right | The chemical theory behind that step |
| Left panel | Apparatus (needed ones first, extras dimmed) |
| Right panel | Chemicals (needed ones first, extras dimmed) |
| Bottom | Key / action index |

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move around the bench |
| Mouse | Look (first person) |
| `LMB` / `E` | Click, pick up, place, use the held item on a target |
| Hold `LMB` / `E` | Timed actions (waiting, drawing a thread, time-lapse heating …) |
| `R` | Put the held item back |
| `Z` (hold) | Zoom |
| `Tab` | Hide / show the side panels |
| `M` | Experiment menu |
| `Esc` | Pause |

Glowing cyan outlines show what to click or pick up; green outlines show where to place it.
Each experiment ends with a lab-notebook step where readings, calculations and graphs are shown.

> Numerical readings are **simulated** from typical data for teaching purposes. In the real lab, use your
> own measured values, the exact quantities, temperatures and times from the manual, and follow your
> instructor's safety rules.

## Code layout

```
index.html, style.css      UI shell (HUD, menus, notebook overlay)
src/main.js                engine: first-person player, interaction, step runner, UI
src/lab.js                 the permanent lab room (benches, sinks, shelves, lights)
src/parts.js               procedural apparatus (glassware, instruments, tools)
src/chart.js               tiny canvas chart for the notebook
src/exp/e1.js … e9.js      one file per experiment: layout + step list + results
```

Adding a step is just adding an object to an experiment's `steps` array:
`kind: 'click' | 'hold' | 'move' | 'use'`, plus the ids involved, the instruction text (`i`), the theory (`th`)
and an optional `fx` that animates the result.
