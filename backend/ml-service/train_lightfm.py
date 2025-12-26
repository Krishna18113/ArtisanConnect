# ml-service/train_lightfm.py
import numpy as np
import scipy.sparse as sp
from lightfm import LightFM
from lightfm.data import Dataset
import joblib
import os

# 1) Build dataset (replace with your real data)
users = ['u1','u2','u3']
items = ['i1','i2','i3','i4']
user_features = [('region', 'IN-DEL'), ('region', 'IN-MUM')]
item_features = [('category','textiles'), ('category','pottery'), ('category','jewelry')]
interactions = [('u1','i1'),('u1','i3'),('u2','i2'),('u3','i4')]  # implicit positives

ds = Dataset()
ds.fit(users, items,
       user_features=[f'{k}:{v}' for k,v in user_features],
       item_features=[f'{k}:{v}' for k,v in item_features])

(ui, _) = ds.build_interactions(interactions)
uf = ds.build_user_features([('u1', ['region:IN-DEL']), ('u2', ['region:IN-MUM']), ('u3', ['region:IN-DEL'])])
itf = ds.build_item_features([('i1',['category:textiles']),
                              ('i2',['category:pottery']),
                              ('i3',['category:jewelry']),
                              ('i4',['category:textiles'])])

# 2) Train LightFM (implicit ranking)
model = LightFM(loss='warp')  # good for implicit feedback ranking
model.fit(ui, user_features=uf, item_features=itf, epochs=20, num_threads=4)

# 3) Persist artifacts
os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/lightfm_model.joblib')
joblib.dump({'ds': ds}, 'models/mappings.joblib')
print('Saved models/lightfm_model.joblib and models/mappings.joblib')
