import json
d = json.load(open('/root/projects/open-public-cam/cameras.json'))
print(type(d), len(d) if isinstance(d, list) else 'not a list')
if isinstance(d, list):
    uni = [c for c in d if isinstance(c, dict) and c.get('source') == 'university']
    print(f"University cameras: {len(uni)}")
    for c in uni[-5:]:
        print(f"  {c.get('id')} - {c.get('name')}")
