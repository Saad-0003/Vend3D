# 3D model credits

Source models obtained from [Poly Pizza](https://poly.pizza). Attribution applies to the
source models; the files in this folder are processed derivatives (meshes split, renamed
and repainted as described below).

| File         | Source model   | Author           | Source                              | Licence                                              |
| ------------ | -------------- | ---------------- | ----------------------------------- | ---------------------------------------------------- |
| `bottle.glb` | Thermos        | Poly by Google   | <https://poly.pizza/m/dm0ZTuKAs45>  | CC BY 3.0 <https://creativecommons.org/licenses/by/3.0/> |
| `cap.glb`    | Baseball cap   | Poly by Google   | <https://poly.pizza/m/aaC5GgcWEhM>  | CC BY 3.0 <https://creativecommons.org/licenses/by/3.0/> |
| `shirt.glb`  | T-shirt        | Poly by Google   | <https://poly.pizza/m/bdOMzzh-fSl>  | CC BY 3.0 <https://creativecommons.org/licenses/by/3.0/> |
| `mug.glb`    | Mug            | MilkAndBanana    | <https://poly.pizza/m/54cOZNS04L>   | CC0 1.0 <https://creativecommons.org/publicdomain/zero/1.0/> |

Modifications made to the source models:

- Meshes classified by geometric position and grouped into named parts
  (`body`, `lid`, `trim`, `crown`, `brim`, `handle`) so the studio can paint each
  part independently; the tee was merged into a single `body` mesh.
- Base colours baked into materials (graphite steel / graphite / cream looks).
- Position normalized: longest axis 1 unit, base at `y = 0`, centred on XZ.
- Interior/hidden geometry and unused node hierarchies pruned.
