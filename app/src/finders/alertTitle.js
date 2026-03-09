import Fuse from "fuse.js";

// import lunr from 'lunr'
// import stemmerSupport from 'lunr-languages/lunr.stemmer.support'
// import stemmerLangFr from 'lunr-languages/lunr.fr'
import terms from "~/misc/alertsList";

const searchKeys = [
  {
    name: "title",
    weight: 1,
  },
  {
    name: "desc",
    weight: 2,
  },
  {
    name: "keywords",
    weight: 2,
  },
];

const fuse = new Fuse(terms, {
  keys: searchKeys,
  threshold: 0.4,
  // shouldSort: true,
});
function fuseSearch(term) {
  return fuse.search(term).map(({ item }) => item);
}

// if (lunr.fr === undefined){
//   require("lunr-languages/lunr.stemmer.support")(lunr)
//   require("lunr-languages/lunr.fr")(lunr)
// }
// const lunrIndex = lunr(function(){
//   this.b(0)
//   this.k1(2)
//   this.use(lunr.fr)
//   this.ref('id')
//   searchKeys.forEach(k => this.field(k))
//   terms.forEach((term) => {
//     this.add(term)
//   })
// })
// function lunrSearch(term){
//   return lunrIndex.search(term, {}).map(({ref})=>terms[ref])
// }

export default function findAlertTitle(term) {
  let results;

  if (!term || term.trim() == "") {
    results = terms;
  } else {
    // results = lunrSearch(term)
    results = fuseSearch(term);
  }

  return results;
}
