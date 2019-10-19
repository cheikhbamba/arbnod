import Store from '../store';
import Family from '../models/family';
import Unit from '../models/unit';
import { withId, relToNode } from '../utils';
import getSpouses from '../utils/getSpouses';
import setUnitDefShifts from '../utils/setUnitDefShifts';
import { FamilyType, IFamilyNode } from '../types';

export default (store: Store) => {
  return function (parentIDs: string[], type: FamilyType = 'root', isMain: boolean = false): Family {
    const family = new Family(store.getNextId(), type, isMain);

    const parents = parentIDs.map(store.getNode.bind(store));
    if (family.main) parents.sort((a, b) => (b.gender !== store.gender) ? -1 : 0);

    family.pUnits.push(new Unit(family.id, parents));

    // CHILDREN
    let children: IFamilyNode[] = [];

    if (parents.length === 1) {
      children = parents[0].children.map(relToNode(store));
    } else {
      const firstParent = parents[0];
      const secondParent = parents[1];

      children = firstParent.children
        .filter(rel => secondParent.children.find(withId(rel.id)))
        .map(relToNode(store));
    }

    // CHILDREN's SPOUSES
    children.forEach(child => {
      if (children[0].id === store.rootNode.children[0].id) {

        family.cUnits.push(new Unit(family.id, [child], true));

      } else if (child.spouses.length > 0) {

        const { left, middle, right } = getSpouses(store, [child]);

        [...left.map(node => [node]),
          middle,
        ...right.map(node => [node])].forEach(nodes =>
          (family.cUnits.push(new Unit(family.id, nodes, true)))
        );

      } else if (child.spouses.length === 0) {
        family.cUnits.push(new Unit(family.id, [child], true));
        //console.log(JSON.stringify(child.id));
      }
    });

    setUnitDefShifts(family);
    return family;
  }
};
