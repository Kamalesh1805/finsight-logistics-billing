import pandas as pd
import json

df = pd.read_excel('Pincode_TAT_Details_01-2-2026--18-35-05.xlsx')

def assign_zone(row):
    state = str(row['state']).upper()
    district = str(row['district']).upper()
    
    # Origin is Chennai, Tamil Nadu
    if state == 'TAMIL NADU':
        if district in ['CHENNAI', 'KANCHIPURAM', 'TIRUVALLUR']:
            return 'LOCAL'
        else:
            return 'REGIONAL'
    elif state in ['KARNATAKA', 'KERALA', 'ANDHRA PRADESH', 'TELANGANA', 'PUDUCHERRY']:
        return 'ZONAL'
    elif district in ['MUMBAI', 'NEW DELHI', 'DELHI', 'KOLKATA', 'BANGALORE', 'BENGALURU', 'HYDERABAD', 'PUNE', 'AHMEDABAD']:
        return 'METRO'
    elif state in ['ASSAM', 'MEGHALAYA', 'ARUNACHAL PRADESH', 'NAGALAND', 'MANIPUR', 'MIZORAM', 'TRIPURA', 'SIKKIM']:
        return 'NE'
    elif state in ['JAMMU & KASHMIR', 'LADAKH', 'ANDAMAN & NICOBAR ISLANDS', 'LAKSHADWEEP']:
        return 'SPL DEST'
    else:
        return 'ROI'

df['zone'] = df.apply(assign_zone, axis=1)

pincodes_list = []
for _, row in df.iterrows():
    pincodes_list.append({
        'pincode': str(row['pincode']),
        'state': str(row['state']).title(),
        'district': str(row['district']).title(),
        'zone': row['zone']
    })

# Save to a JSON file in the js folder
with open('js/pincodes.json', 'w') as f:
    json.dump(pincodes_list, f)

print(f"Successfully processed {len(pincodes_list)} pincodes.")
