import json
import sys

mapfile = sys.argv[1] if len(sys.argv) > 1 else 'js/data/maps/map_battle_01.json'

with open(mapfile, 'r') as f:
    d = json.load(f)

W, H = d['width'], d['height']
print(f'Map: {W}x{H} = {W*H}')
print(f'tileWidth: {d["tileWidth"]}, tileHeight: {d["tileHeight"]}')

for layer in d['layers']:
    ok = len(layer['data']) == W * H
    print(f'Layer "{layer["name"]}" ({layer["type"]}): {len(layer["data"])} tiles {"OK" if ok else "ERROR!"}')

print(f'TilesetRefs: {len(d["tilesetRefs"])} - {[r["id"] for r in d["tilesetRefs"]]}')
print(f'Triggers: {len(d["triggers"])}')
print(f'Spawns: {len(d["spawns"])}')

player_spawns = [s for s in d['spawns'] if s['type'] == 'player']
enemy_spawns = [s for s in d['spawns'] if s['type'] == 'enemy']
print(f'  Players: {len(player_spawns)} at {[(s["x"],s["y"]) for s in player_spawns]}')
print(f'  Enemies: {len(enemy_spawns)} at {[(s["x"],s["y"]) for s in enemy_spawns]}')

collision = None
for layer in d['layers']:
    if layer['type'] == 'collision':
        collision = layer['data']
        break

if collision:
    for s in d['spawns']:
        x, y = s['x'], s['y']
        in_bounds = 0 <= x < W and 0 <= y < H
        walkable = collision[y * W + x] == 0 if in_bounds else False
        status = 'OK' if (in_bounds and walkable) else 'ERROR'
        print(f'  Spawn ({x},{y}) {s["type"]}: {status}')

print('Validation complete.')
